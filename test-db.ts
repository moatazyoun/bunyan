import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/db-status');
    const text = await res.text();
    console.log('db-status:', text);
  } catch(e) {
    console.error('Error fetching db-status:', e);
  }
}
test();
