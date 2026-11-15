const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080/api/v1';

let coordToken = '';
let student1Token = '';
let student2Token = '';
let cycleId = null;
let phaseId = null;
let teamId = null;
let student2Id = null;
let projectId = null;
let submissionId = null;
let documentId = null;
let evaluationId = null;

const results = [];

async function req(name, method, endpoint, body = null, token = null, isMultipart = false, formData = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let options = { method, headers };

  if (isMultipart) {
    options.body = formData;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    const ok = res.status >= 200 && res.status < 300;
    results.push({ name, method, endpoint, status: res.status, ok, data: typeof data === 'object' ? data : data.slice(0, 80) });
    console.log(`${ok ? '✅' : '❌'} [${res.status}] ${method} ${endpoint} - ${name}`);
    if (!ok) {
      console.log('   Error details:', JSON.stringify(data));
    }
    return { status: res.status, ok, data };
  } catch (err) {
    results.push({ name, method, endpoint, status: 0, ok: false, error: err.message });
    console.log(`💥 [ERR] ${method} ${endpoint} - ${name}: ${err.message}`);
    return { status: 0, ok: false, error: err.message };
  }
}

async function run() {
  console.log('====================================================');
  console.log('🚀 TESTING EVERY BACKEND API ENDPOINT');
  console.log('====================================================\n');

  // 1. Auth: Login Coordinator
  const coordLogin = await req('Login Coordinator', 'POST', '/auth/login', {
    pnr: 'COORD001',
    password: 'Coordinator@123'
  });
  if (coordLogin.ok) coordToken = coordLogin.data.token;

  const ts = Date.now().toString().slice(-4);
  const pnr1 = `STU1${ts}`;
  const pnr2 = `STU2${ts}`;
  const coordPnr = `COORD${ts}`;

  // 2. Auth: Register Student 1
  const s1Reg = await req('Register Student 1', 'POST', '/auth/register', {
    pnr: pnr1,
    name: 'Alice Student',
    email: `alice.${ts}@university.edu`,
    password: 'Student@123',
    department: 'Computer Science',
    role: 'STUDENT'
  });
  if (s1Reg.ok) student1Token = s1Reg.data.token;

  // 3. Auth: Register Student 2
  const s2Reg = await req('Register Student 2', 'POST', '/auth/register', {
    pnr: pnr2,
    name: 'Bob Peer',
    email: `bob.${ts}@university.edu`,
    password: 'Student@123',
    department: 'Computer Science',
    role: 'STUDENT'
  });
  if (s2Reg.ok) {
    student2Token = s2Reg.data.token;
  }

  // 4. Admin: Provision New Coordinator
  await req('Provision Coordinator', 'POST', '/admin/coordinators', {
    pnr: coordPnr,
    name: 'Prof. David Clark',
    email: `david.${ts}@university.edu`,
    password: 'Coordinator@123',
    department: 'Information Technology'
  }, coordToken);

  // 5. Academic Cycle: Create Cycle
  const createCycle = await req('Create Academic Cycle', 'POST', '/academic-cycles', {
    name: `Capstone Spring ${ts}`,
    academicYear: '2026-2027',
    startDate: '2027-01-10',
    endDate: '2027-06-30'
  }, coordToken);
  if (createCycle.ok) cycleId = createCycle.data.id;

  // 6. Academic Cycle: Get All
  await req('Get All Academic Cycles', 'GET', '/academic-cycles', null, coordToken);

  // 7. Academic Cycle: Get Active
  await req('Get Active Academic Cycles', 'GET', '/academic-cycles/active', null, student1Token);

  // 8. Academic Cycle: Get By ID
  if (cycleId) {
    await req('Get Cycle by ID', 'GET', `/academic-cycles/${cycleId}`, null, student1Token);

    // 9. Academic Cycle: Update
    await req('Update Cycle', 'PUT', `/academic-cycles/${cycleId}`, {
      name: `Capstone Spring ${ts} Updated`,
      academicYear: '2026-2027',
      startDate: '2027-01-10',
      endDate: '2027-06-30',
      active: true
    }, coordToken);
  }

  // 10. Phase: Create Phase 1
  const createPhase1 = await req('Create Phase 1', 'POST', '/phases', {
    cycleId: cycleId,
    name: 'Synopsis Submission',
    description: 'Initial problem formulation and literature review',
    openingDate: new Date(Date.now() - 3600000).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
    requiredDocuments: 'PDF Synopsis report and initial architecture document',
    maxMarks: 50.0,
    sequenceOrder: 1,
    active: true
  }, coordToken);
  if (createPhase1.ok) phaseId = createPhase1.data.id;

  // 11. Phase: Create Phase 2
  await req('Create Phase 2', 'POST', '/phases', {
    cycleId: cycleId,
    name: 'Mid-term Progress & Prototype',
    description: 'Working code prototype demonstration',
    openingDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 45).toISOString(),
    requiredDocuments: 'Working code repository link and slide deck',
    maxMarks: 50.0,
    sequenceOrder: 2,
    active: true
  }, coordToken);

  // 12. Phase: Get Phases by Cycle
  await req('Get Phases by Cycle', 'GET', `/phases?cycleId=${cycleId}`, null, student1Token);

  // 13. Phase: Get Phase by ID
  if (phaseId) {
    await req('Get Phase by ID', 'GET', `/phases/${phaseId}`, null, student1Token);

    // 14. Phase: Update Phase & Record Deadline History
    await req('Update Phase Deadline', 'PUT', `/phases/${phaseId}`, {
      name: 'Synopsis Submission Extended',
      description: 'Extended for department revisions',
      openingDate: new Date(Date.now() - 3600000).toISOString(),
      deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
      maxMarks: 50.0,
      sequenceOrder: 1,
      active: true,
      deadlineChangeReason: 'Department examination schedule buffer'
    }, coordToken);

    // 15. Phase: Get Deadline History
    await req('Get Phase Deadline History', 'GET', `/phases/${phaseId}/deadline-history`, null, coordToken);

    // 16. Criteria: Create Criterion 1
    const crit1 = await req('Create Criterion 1 (Technical Depth)', 'POST', `/phases/${phaseId}/criteria`, {
      name: 'Technical Architecture & Feasibility',
      description: 'Soundness of technical stack and database design',
      maxMarks: 30.0,
      criterionType: 'MANUAL'
    }, coordToken);

    // 17. Criteria: Create Criterion 2
    const crit2 = await req('Create Criterion 2 (Timeliness)', 'POST', `/phases/${phaseId}/criteria`, {
      name: 'Timeliness of Submission',
      description: 'Full points if submitted prior to deadline',
      maxMarks: 20.0,
      criterionType: 'AUTOMATIC_TIMELINESS'
    }, coordToken);

    // 18. Criteria: Get Criteria by Phase
    await req('Get Criteria by Phase', 'GET', `/phases/${phaseId}/criteria`, null, student1Token);
  }

  // 19. Team: Create Team (Student 1)
  const createTeam = await req('Create Team', 'POST', '/teams', {
    name: 'Team Alpha Pioneers',
    cycleId: cycleId
  }, student1Token);
  if (createTeam.ok) teamId = createTeam.data.id;

  if (teamId) {
    // 20. Team: Add Member (Student 2)
    await req('Add Team Member', 'POST', `/teams/${teamId}/members`, {
      pnr: pnr2
    }, student1Token);

    // 21. Team: Get Team by ID
    await req('Get Team by ID', 'GET', `/teams/${teamId}`, null, student1Token);

    // 22. Team: List Teams by Cycle
    await req('List Teams by Cycle', 'GET', `/teams?cycleId=${cycleId}`, null, coordToken);

    // 23. Team: Get My Team
    await req('Get My Team', 'GET', `/teams/my-team?cycleId=${cycleId}`, null, student1Token);

    // 24. Team: Submit Team for Review
    await req('Submit Team', 'POST', `/teams/${teamId}/submit`, null, student1Token);

    // 25. Team: Put Under Review (Coordinator)
    await req('Put Team Under Review', 'POST', `/teams/${teamId}/review`, null, coordToken);

    // 26. Team: Approve Team (Coordinator)
    await req('Approve Team', 'POST', `/teams/${teamId}/approve`, null, coordToken);

    // 27. Project: Register Project (Student 1)
    const createProj = await req('Register Project', 'POST', '/projects', {
      teamId: teamId,
      title: 'Autonomous Distributed Cloud Scheduler',
      description: 'A fault-tolerant distributed container scheduling system with adaptive load balancing.',
      domain: 'Cloud Computing & Distributed Systems',
      githubRepoUrl: 'https://github.com/octocat/Hello-World'
    }, student1Token);
    if (createProj.ok) projectId = createProj.data.id;
  }

  if (projectId) {
    // 28. Project: Get Project by ID
    await req('Get Project by ID', 'GET', `/projects/${projectId}`, null, student1Token);

    // 29. Project: Get Project by Team
    await req('Get Project by Team', 'GET', `/projects/by-team/${teamId}`, null, student1Token);

    // 30. Project: Update Project
    await req('Update Project', 'PUT', `/projects/${projectId}`, {
      title: 'Autonomous Distributed Cloud Scheduler V2',
      description: 'Updated with Kubernetes and Raft consensus algorithm integration.',
      domain: 'Distributed Systems & High Availability',
      githubRepoUrl: 'https://github.com/octocat/Hello-World'
    }, student1Token);

    // 31. Project: Submit Project
    await req('Submit Project', 'POST', `/projects/${projectId}/submit`, null, student1Token);

    // 32. Project: Put Under Review (Coordinator)
    await req('Put Project Under Review', 'POST', `/projects/${projectId}/review`, null, coordToken);

    // 33. Project: Approve Project (Coordinator)
    await req('Approve Project', 'POST', `/projects/${projectId}/approve`, null, coordToken);

    // 34. Project: Get Projects Filtered
    await req('Get Approved Projects', 'GET', `/projects?cycleId=${cycleId}&status=APPROVED`, null, coordToken);

    // 35. Submission: Upload Deliverable File
    const dummyFilePath = path.join(__dirname, 'test-deliverable.pdf');
    fs.writeFileSync(dummyFilePath, '%PDF-1.4 Dummy capstone synopsis content for testing %EOF');

    const form = new FormData();
    const fileBytes = fs.readFileSync(dummyFilePath);
    const blob = new Blob([fileBytes], { type: 'application/pdf' });
    form.append('files', blob, 'synopsis-report.pdf');

    const submitRes = await req(
      'Submit Phase Deliverable (Multipart)',
      'POST',
      `/phases/${phaseId}/submissions?projectId=${projectId}&notes=Initial+complete+synopsis+draft`,
      null,
      student1Token,
      true,
      form
    );

    if (submitRes.ok) {
      submissionId = submitRes.data.id;
      if (submitRes.data.documents && submitRes.data.documents.length > 0) {
        documentId = submitRes.data.documents[0].id;
      }
    }

    try { fs.unlinkSync(dummyFilePath); } catch (e) {}

    // 36. Submission: Get History
    await req('Get Submission History', 'GET', `/phases/${phaseId}/submissions?projectId=${projectId}`, null, student1Token);

    // 37. Submission: Get By ID
    if (submissionId) {
      await req('Get Submission by ID', 'GET', `/submissions/${submissionId}`, null, student1Token);
    }

    // 38. Document: Download Document
    if (documentId) {
      await req('Download Document', 'GET', `/documents/${documentId}/download`, null, coordToken);
    }

    // 39. Evaluation: Evaluate Submission
    if (submissionId) {
      const criteriaList = await req('Fetch Criteria for Scoring', 'GET', `/phases/${phaseId}/criteria`, null, coordToken);
      const critMarks = [];
      if (criteriaList.ok && Array.isArray(criteriaList.data)) {
        for (const c of criteriaList.data) {
          if (c.criterionType === 'MANUAL') {
            critMarks.push({
              criterionId: c.id,
              marksAwarded: 28.0,
              remarks: 'Outstanding architectural design and clear methodology'
            });
          }
        }
      }

      const evalRes = await req('Evaluate Submission', 'POST', `/submissions/${submissionId}/evaluate`, {
        marks: critMarks,
        generalRemarks: 'Impressive literature review and well-defined architecture. Proceed to Phase 2.'
      }, coordToken);

      if (evalRes.ok) evaluationId = evalRes.data.id;
    }

    // 40. Evaluation: Get Evaluation by ID
    if (evaluationId) {
      await req('Get Evaluation by ID', 'GET', `/evaluations/${evaluationId}`, null, coordToken);

      // 41. Evaluation: Publish Evaluation
      await req('Publish Evaluation', 'POST', `/evaluations/${evaluationId}/publish`, null, coordToken);
    }

    // 42. Evaluation: Get Evaluations for Project
    await req('Get Evaluations for Project', 'GET', `/projects/${projectId}/evaluations`, null, student1Token);

    // 43. Dashboard: Student Dashboard
    await req('Student Dashboard', 'GET', `/dashboard/student?cycleId=${cycleId}`, null, student1Token);

    // 44. Dashboard: Coordinator Dashboard
    await req('Coordinator Dashboard', 'GET', `/dashboard/coordinator?cycleId=${cycleId}`, null, coordToken);

    // 45. GitHub: Snapshot Data
    await req('Get GitHub Snapshot', 'GET', `/projects/${projectId}/github`, null, student1Token);

    // 46. GitHub: History
    await req('Get GitHub History', 'GET', `/projects/${projectId}/github/history`, null, student1Token);
  }

  // 47. Notifications: Get Notifications
  const notifs = await req('Get User Notifications', 'GET', '/notifications', null, student1Token);
  let notifId = null;
  if (notifs.ok && Array.isArray(notifs.data) && notifs.data.length > 0) {
    notifId = notifs.data[0].id;
  }

  // 48. Notifications: Mark Single Read
  if (notifId) {
    await req('Mark Notification as Read', 'PATCH', `/notifications/${notifId}/read`, null, student1Token);
  }

  // 49. Notifications: Mark All Read
  await req('Mark All Notifications Read', 'POST', '/notifications/mark-all-read', null, student1Token);

  // 50. Audit Logs: Coordinator Audit
  await req('Get All Audit Logs', 'GET', '/audit-logs', null, coordToken);

  console.log('\n====================================================');
  console.log('📊 TEST SUMMARY RESULTS:');
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Total APIs Tested: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('====================================================\n');
}

run();
