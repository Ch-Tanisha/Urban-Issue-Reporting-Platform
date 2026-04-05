// UrbanVoice — Consolidated Mock Data
// Used across all 3 dashboards until backend is connected

export const blocks = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E'];

export const categories = [
  'Road & Infrastructure',
  'Garbage & Sanitation',
  'Water Supply',
  'Electricity & Lighting',
  'Public Safety',
  'Drainage',
  'Other',
];

export const officers = [
  { id: 'o1', name: 'Ravi Kumar',   block: 'Block A', email: 'ravi@urbanvoice.in',   phone: '+91 98765 43210', avatar: 'RK' },
  { id: 'o2', name: 'Priya Sharma', block: 'Block B', email: 'priya@urbanvoice.in',  phone: '+91 87654 32109', avatar: 'PS' },
  { id: 'o3', name: 'Arjun Patel',  block: 'Block C', email: 'arjun@urbanvoice.in',  phone: '+91 76543 21098', avatar: 'AP' },
  { id: 'o4', name: 'Meena Nair',   block: 'Block D', email: 'meena@urbanvoice.in',  phone: '+91 65432 10987', avatar: 'MN' },
  { id: 'o5', name: 'Suresh Rao',   block: 'Block E', email: 'suresh@urbanvoice.in', phone: '+91 54321 09876', avatar: 'SR' },
];

export const initialIssues = [
  {
    id: 1, title: 'Potholes near main market',
    description: 'Multiple deep potholes causing traffic and water logging after rain.',
    block: 'Block A', category: 'Road & Infrastructure', priority: 'High',
    status: 'Reported', reportedOn: '2025-11-25',
    address: 'Main Market Road, near bus stop',
    citizenName: 'Rahul Sharma', citizenContact: 'rahul@example.com', citizenPhone: '+91 99887 76655',
    isDuplicate: false, image: null,
  },
  {
    id: 2, title: 'Streetlight not working',
    description: 'Streetlight opposite House 42 has been off for 3 days.',
    block: 'Block A', category: 'Electricity & Lighting', priority: 'Medium',
    status: 'In Progress', reportedOn: '2025-11-20',
    address: 'Street 3, opposite House 42',
    citizenName: 'Anita Das', citizenContact: 'anita@example.com', citizenPhone: '+91 88776 65544',
    isDuplicate: false, image: null,
  },
  {
    id: 3, title: 'Garbage not collected',
    description: 'Overflowing garbage bin attracting stray animals.',
    block: 'Block B', category: 'Garbage & Sanitation', priority: 'High',
    status: 'Reported', reportedOn: '2025-11-18',
    address: 'Lane 5, near community hall',
    citizenName: 'Sanjay Kumar', citizenContact: 'sanjay@example.com', citizenPhone: '+91 77665 54433',
    isDuplicate: false, image: null,
  },
  {
    id: 4, title: 'Blocked drainage',
    description: 'Drainage near the park is blocked, causing bad smell.',
    block: 'Block A', category: 'Drainage', priority: 'Medium',
    status: 'Resolved', reportedOn: '2025-11-15',
    address: 'Park Road, Block A',
    citizenName: 'Meera Patnaik', citizenContact: 'meera@example.com', citizenPhone: '+91 66554 43322',
    isDuplicate: false, image: null,
  },
  {
    id: 5, title: 'Water supply disruption',
    description: 'No water supply since yesterday morning in the entire lane.',
    block: 'Block C', category: 'Water Supply', priority: 'High',
    status: 'In Progress', reportedOn: '2025-11-28',
    address: 'Lane 2, Block C',
    citizenName: 'Vikram Joshi', citizenContact: 'vikram@example.com', citizenPhone: '+91 55443 32211',
    isDuplicate: false, image: null,
  },
  {
    id: 6, title: 'Broken footpath tiles',
    description: 'Several tiles on the footpath near school are broken and dangerous for children.',
    block: 'Block B', category: 'Road & Infrastructure', priority: 'Low',
    status: 'Reported', reportedOn: '2025-11-22',
    address: 'School Road, Block B',
    citizenName: 'Sunita Desai', citizenContact: 'sunita@example.com', citizenPhone: '+91 44332 21100',
    isDuplicate: false, image: null,
  },
  {
    id: 7, title: 'Open manhole on main road',
    description: 'Open manhole is a major safety hazard especially at night.',
    block: 'Block D', category: 'Public Safety', priority: 'High',
    status: 'Resolved', reportedOn: '2025-11-10',
    address: 'Main Road, Block D',
    citizenName: 'Amit Singh', citizenContact: 'amit@example.com', citizenPhone: '+91 33221 10099',
    isDuplicate: false, image: null,
  },
  {
    id: 8, title: 'Stray dogs near park',
    description: 'Large group of aggressive stray dogs near children\'s park.',
    block: 'Block E', category: 'Public Safety', priority: 'Medium',
    status: 'In Progress', reportedOn: '2025-11-26',
    address: 'Park Avenue, Block E',
    citizenName: 'Kavitha Reddy', citizenContact: 'kavitha@example.com', citizenPhone: '+91 22110 09988',
    isDuplicate: false, image: null,
  },
];

// Simulated current logged-in citizen
export const currentCitizen = {
  name: 'Raj Sharma',
  email: 'raj.sharma@example.com',
  phone: '+91 98765 12345',
  address: '12 Gandhi Nagar, Near Temple',
  city: 'Bangalore',
  zip: '560001',
  block: 'Block A',
};
