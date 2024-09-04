import { useState, useEffect } from 'react';
import './App.css';

//Constructor for Race Data Table
const RCTable = ({ RCdata }) => {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', overflow: 'hidden' }}>
      <thead>
        <tr style={{ backgroundColor: '#003087', color: '#FFFFFF' }}>
          <th>Category</th>
          <th>Date and Time (UTC)</th>
          <th>Driver Number</th>
          <th>Flag</th>
          <th>Lap Number</th>
          <th>Message</th>
          <th>Scope</th>
        </tr>
      </thead>
      <tbody>
        {RCdata.map((data, index) => (
          <tr
            key={index}
            style={{
              backgroundColor: index % 2 === 0 ? '#EDEFF2' : '#FFFFFF', //Alternating colors for each row
              color: '#000000',
              animation: `fadeIn 0.5s ease ${index * 0.1}s both, slideIn 0.5s ease ${index * 0.1}s both`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B3C7E6')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                index % 2 === 0 ? '#EDEFF2' : '#FFFFFF')
            }
          >
            <td>{data.category}</td>
            <td>{new Date(data.date).toLocaleString('en-US', { timeZone: 'UTC'})}</td> {/*Converts time zone to UTC time */}
            <td>{data.driver_number || 'N/A'}</td>
            <td>{data.flag || 'N/A'}</td>
            <td>{data.lap_number}</td>
            <td>{data.message}</td>
            <td>{data.scope || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

function App() {
  // State for fetched data from API
  const [meeting, setMeeting] = useState('');
  const [meetingList, setMeetingList] = useState({});
  const [meetKey, setMeetKey] = useState(null);
  const [raceData, setRaceData] = useState([]);
  const [raceSessionKey, setRaceSessionKey] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for table filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [flagFilter, setFlagFilter] = useState('');


  // Function to fetch meetKey data
  // meetKey is the unique key used for each Grand Prix
  async function GetMeeting() {
    try {
      const request = await fetch('https://api.openf1.org/v1/meetings');
      const response = await request.json();
      setMeetingList(response);

      // Set initial meeting and meetKey based on the last meeting (most recent) in the list
      const firstMeetingKey = Object.keys(response)[Object.keys(response).length - 1];
      if (firstMeetingKey) {
        setMeetKey('');
        setMeeting('');
      }
    } catch (error) {
      console.error('Cannot fetch meeting data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch race session key when meetKey changes
  // session_key is the unique key for the Race session of the meeting
  useEffect(() => {
    async function GetRaceSessionKey() {
      if (meetKey) {
        try {
          setLoading(true);
          const request = await fetch(
            'https://api.openf1.org/v1/sessions?meeting_key=' + meetKey + '&session_name=Race'
          );
          const response = await request.json();
          if (response[0]) {
            setRaceSessionKey(response[0].session_key);
          }
        } catch (error) {
          console.error('Cannot fetch race session key:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    GetRaceSessionKey();
  }, [meetKey]);

  // Fetch race control data when session_key is fetched
  useEffect(() => {
    async function getRaceControlData() {
      if (raceSessionKey) {
        try {
          setLoading(true);
          const endpoint = 'https://api.openf1.org/v1/race_control?session_key=' + raceSessionKey + '&meeting_key=' + meetKey;
          const request = await fetch(endpoint);
          const response = await request.json();
          
          // Convert all driver numbers to strings for filters to work
          // Null driver values will be replaced by 'N/A'
          const stringData = response.map(item => ({ ...item, driver_number: item.driver_number ? String(item.driver_number) : 'N/A'}));
          setRaceData(stringData);
          
        } catch (error) {
          console.error('Cannot fetch race control data:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    getRaceControlData();
  }, [raceSessionKey]);

  // handler for clicking available meetings
  function meetingOnclick(event) {
    const key = event.target.id; //meeting_key
    const name = event.target.innerText; //meeting_official_name
    setMeetKey(key);
    setMeeting(name);
    setCategoryFilter('');
    setDriverFilter(''); 
    setFlagFilter('');
  }

  // Prepare meeting array for rendering
  // order reversed to make latest meeting appear on top
  const meetingArray = Object.entries(meetingList).reverse();

  // Filter table based on dropdown selections
  const filteredData = raceData.filter((data) => {
    return (
      (!categoryFilter || data.category === categoryFilter) &&
      (!driverFilter || (data.driver_number || 'N/A') === driverFilter) &&
      (!flagFilter || data.flag === flagFilter)
    );
  });

  // Initialize meeting
  useEffect(() => {
    GetMeeting();
  }, []);

  return (
    <>
      <h1>FORMULA 1 RACE CONTROL ANNOUNCEMENT TRACKER</h1>
      <h2>
        This tool provides up-to-date tracking of all Race Control announcements from the 2023 and 2024 Formula 1 seasons, 
        offering details on flags, penalties, and announcements made by the stewards throughout each race.
      </h2>
      <div className="container">
        <aside className="sidebar">
          <ul id="meetinglist">
            {meetingArray.map(([key, item]) => (
              <li onClick={meetingOnclick} id={item.meeting_key} key={key}>
                {item.meeting_official_name}
              </li>
            ))}
          </ul>
        </aside>
        <main className="main-content">
          <h2>{meeting}</h2>
          {loading ? (
            <p style={{ width: '100%', borderCollapse: 'collapse' }}>Loading...</p>
          ) : (
            <>
              <div className="filters">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {[...new Set(raceData.map((data) => data.category))].map(
                    (category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                >
                  <option value="">All Drivers</option>
                  {[...new Set(raceData.map((data) => data.driver_number))].map(
                    (driver, index) => (
                      <option key={index} value={driver}>
                        {driver}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={flagFilter}
                  onChange={(e) => setFlagFilter(e.target.value)}
                >
                  <option value="">All Flags</option>
                  {[...new Set(raceData.map((data) => data.flag))].map(
                    (flag, index) => (
                      <option key={index} value={flag}>
                        {flag}
                      </option>
                    )
                  )}
                </select>
              </div>
              <RCTable RCdata={filteredData} />
            </>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
