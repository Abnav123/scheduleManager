const test = async () => {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: "admin",
        password: "adminpassword123"
      })
    });
    
    if (!loginRes.ok) {
      const text = await loginRes.text();
      throw new Error(`Login failed: ${text}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Token retrieved.");

    // 2. Post Timetable
    console.log("Posting timetable...");
    const timetableRes = await fetch('http://localhost:5000/api/timetables', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "absdasdasd",
        startDate: "2026-06-27",
        endDate: "2026-06-27",
        defaultSchedule: []
      })
    });
    
    const data = await timetableRes.json();
    if (!timetableRes.ok) {
      console.error("Error status:", timetableRes.status);
      console.error("Error message:", data.message);
      if (data.stack) {
        console.error("Stack trace:", data.stack);
      }
    } else {
      console.log("Timetable created successfully:", data);
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
};

test();
