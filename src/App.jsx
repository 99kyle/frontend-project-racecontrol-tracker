import { useState, useEffect } from 'react';
import './App.css';


let raceDataArray = [];

//Constructor for Race Data Table
const RCTable = ({ RCdata }) => {
  console.log(raceDataArray);
  return (
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          backgroundColor: index % 2 === 0 ? '#EDEFF2' : '#FFFFFF', // Alternating row colors
          color: '#000000',
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B3C7E6')}
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor =
            index % 2 === 0 ? '#EDEFF2' : '#FFFFFF')
        }
      >
        <td>{data.category}</td>
        <td>{new Date(data.date).toLocaleString()}</td>
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
  const [meeting, setMeeting] = useState(''); 
  const [meetingList, setMeetingList] = useState({});
  const [meetKey, setMeetKey] = useState(null);
  const [raceData, setRaceData] = useState([]);
  const [raceSessionKey, setRaceSessionKey] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Function to fetch meetKey data
  // meetKey is the unique key used for each Grand Prix
  async function GetMeeting() {
    try {
      const request = await fetch('https://api.openf1.org/v1/meetings');
      const response = await request.json();
      setMeetingList(response);

      // Set initial meeting and meetKey based on the last meeting (most recent) in the list
      const firstMeetingKey = Object.keys(response)[Object.keys(response).length  - 1];
      if (firstMeetingKey) {
        setMeetKey('');
        setMeeting('');
      }
    } catch (error) {
      console.error('Cannot fetch data:', error);
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
          console.error('Cannot fetch data:', error);
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
          setRaceData(response);
        } catch (error) {
          console.error('Cannot fetch data:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    getRaceControlData();
  }, [raceSessionKey]);

  // Initialize meetings on component mount
  useEffect(() => {
    GetMeeting();
  }, []);

  // handler for clicking available meetings
  function meetingOnclick(event) {
    const key = event.target.id;
    const name = event.target.innerText;
    setMeetKey(key);
    setMeeting(name);
  }

  // Prepare meeting array for rendering
  // order reversed to make latest meeting appear on top
  const meetingArray = Object.entries(meetingList).reverse();

  return (
    <>
    <h1> FORMULA 1 RACE CONTROL ANNOUNCEMENT TRACKER</h1>
    <h2> This tool provides up-to-date tracking of all Race Control announcements from the 2023 and 2024 Formula 1 seasons, offering details on flags, penalties, and announcements throughout each race</h2>
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
            <p>Loading...</p>
          ) : (
            <RCTable RCdata={(Object.values(raceData))} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;