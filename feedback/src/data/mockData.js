export const mockUsers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    password: 'password',
    role: 'manager'
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike@company.com',
    password: 'password',
    role: 'employee',
    managerId: 1
  },
  {
    id: 3,
    name: 'Emma Davis',
    email: 'emma@company.com',
    password: 'password',
    role: 'employee',
    managerId: 1
  },
  {
    id: 4,
    name: 'Alex Rodriguez',
    email: 'alex@company.com',
    password: 'password',
    role: 'employee',
    managerId: 1
  }
];

export const mockFeedback = [
  {
    id: 1,
    employeeId: 2,
    managerId: 1,
    employeeName: 'Mike Chen',
    managerName: 'Sarah Johnson',
    strengths: 'Excellent problem-solving skills and great attention to detail. Always delivers high-quality work on time.',
    improvements: 'Could improve communication with stakeholders and be more proactive in team meetings.',
    sentiment: 'positive',
    tags: 'problem-solving, quality, communication',
    comments: 'Overall great performance this quarter.',
    date: '2024-01-15T10:00:00Z',
    acknowledged: true
  },
  {
    id: 2,
    employeeId: 3,
    managerId: 1,
    employeeName: 'Emma Davis',
    managerName: 'Sarah Johnson',
    strengths: 'Strong leadership qualities and excellent team collaboration. Great at mentoring junior developers.',
    improvements: 'Could focus more on technical documentation and code reviews.',
    sentiment: 'positive',
    tags: 'leadership, collaboration, mentoring',
    comments: 'Keep up the excellent work!',
    date: '2024-01-10T14:30:00Z',
    acknowledged: false
  }
];