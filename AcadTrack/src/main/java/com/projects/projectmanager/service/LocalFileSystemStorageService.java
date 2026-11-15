package com.projects.projectmanager.service;

import com.projects.projectmanager.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class LocalFileSystemStorageService implements FileStorageService {

    private final Path rootLocation;
    private final List<String> allowedTypes;
    private final long maxFileSize;

    public LocalFileSystemStorageService(
            @Value("${app.storage.location:./uploads}") String storageLocation,
            @Value("${app.storage.allowed-types:application/pdf,image/png,image/jpeg}") String allowedTypesStr,
            @Value("${app.storage.max-file-size:10MB}") String maxFileSizeStr) {
        this.rootLocation = Paths.get(storageLocation).toAbsolutePath().normalize();
        this.allowedTypes = Arrays.stream(allowedTypesStr.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .toList();
        this.maxFileSize = parseSize(maxFileSizeStr);

        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String subDirectory) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_FILE", "Failed to store empty file");
        }

        if (file.getSize() > maxFileSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE",
                    "File size exceeds maximum permitted size of " + maxFileSize + " bytes");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILE_TYPE",
                    "File type '" + contentType + "' is not permitted. Allowed: " + allowedTypes);
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");

        if (originalFilename.contains("..")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILENAME",
                    "Filename contains invalid path sequence: " + originalFilename);
        }

        String extension = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            extension = originalFilename.substring(dotIdx);
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path targetDir = this.rootLocation.resolve(subDirectory).normalize();

        try {
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(storedFileName).normalize();

            if (!targetFile.startsWith(this.rootLocation)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SECURITY_ERROR",
                        "Cannot store file outside current storage directory");
            }

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            return this.rootLocation.relativize(targetFile).toString();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_ERROR",
                    "Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public Resource loadFileAsResource(String storagePath) {
        try {
            Path filePath = this.rootLocation.resolve(storagePath).normalize();
            if (!filePath.startsWith(this.rootLocation)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SECURITY_ERROR",
                        "Cannot access file outside current storage directory");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ApiException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found: " + storagePath);
            }
        } catch (MalformedURLException e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "FILE_NOT_FOUND", "File not found: " + storagePath);
        }
    }

    @Override
    public void deleteFile(String storagePath) {
        try {
            Path filePath = this.rootLocation.resolve(storagePath).normalize();
            if (filePath.startsWith(this.rootLocation)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {
        }
    }

    private long parseSize(String sizeStr) {
        String cleaned = sizeStr.trim().toUpperCase();
        if (cleaned.endsWith("MB")) {
            return Long.parseLong(cleaned.replace("MB", "")) * 1024 * 1024;
        } else if (cleaned.endsWith("KB")) {
            return Long.parseLong(cleaned.replace("KB", "")) * 1024;
        } else if (cleaned.endsWith("GB")) {
            return Long.parseLong(cleaned.replace("GB", "")) * 1024 * 1024 * 1024;
        }
        return Long.parseLong(cleaned);
    }
}

