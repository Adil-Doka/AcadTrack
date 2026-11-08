package com.projects.projectmanager.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(MultipartFile file, String subDirectory);
    Resource loadFileAsResource(String storagePath);
    void deleteFile(String storagePath);
}

