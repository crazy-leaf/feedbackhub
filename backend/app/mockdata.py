from datetime import datetime, timezone
import uuid

mock_users = [
  {
    'id': 1,
    'name': 'Sarah Johnson',
    'email': 'sarah@company.com',
    'password': 'password123',
    'role': 'manager'
  },
  {
    'id': 2,
    'name': 'Mike Chen',
    'email': 'mike@company.com',
    'password': 'password123',
    'role': 'employee',
    'managerId': 1
  },
  {
    'id': 3,
    'name': 'Emma Davis',
    'email': 'emma@company.com',
    'password': 'password123',
    'role': 'employee',
    'managerId': 1
  },
  {
    'id': 4,
    'name': 'Alex Rodriguez',
    'email': 'alex@company.com',
    'password': 'password123',
    'role': 'employee',
    'managerId': 1
  }
]

mock_feedback = [
  {
    'id': 101,
    'employeeId': 2,
    'managerId': 1,
    'employeeName': 'Mike Chen',
    'managerName': 'Sarah Johnson',
    'strengths': 'Excellent problem-solving skills and great attention to detail. Always delivers high-quality work on time.',
    'improvements': 'Could improve communication with stakeholders and be more proactive in team meetings.',
    'sentiment': 'positive',
    'tags': 'problem-solving, quality, communication',
    'comments': 'Overall great performance this quarter.',
    'date': '2024-01-15T10:00:00Z',
    'acknowledged': True
  },
  {
    'id': 102,
    'employeeId': 3,
    'managerId': 1,
    'employeeName': 'Emma Davis',
    'managerName': 'Sarah Johnson',
    'strengths': 'Strong leadership qualities and excellent team collaboration. Great at mentoring junior developers.',
    'improvements': 'Could focus more on technical documentation and code reviews.',
    'sentiment': 'positive',
    'tags': 'leadership, collaboration, mentoring',
    'comments': 'Keep up the excellent work!',
    'date': '2024-01-10T14:30:00Z',
    'acknowledged': False
  },
   {
    'id': 103,
    'employeeId': 2,
    'managerId': 1,
    'employeeName': 'Mike Chen',
    'managerName': 'Sarah Johnson',
    'strengths': 'Very adaptable and quick learner.',
    'improvements': 'Ensure consistent code formatting in pull requests.',
    'sentiment': 'neutral',
    'tags': 'adaptability, learning, code-quality',
    'comments': 'Good progress!',
    'date': '2024-04-20T11:00:00Z',
    'acknowledged': False
  }
]