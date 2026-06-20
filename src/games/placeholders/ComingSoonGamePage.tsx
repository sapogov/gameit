import { useNavigate, useParams } from 'react-router-dom';

export const ComingSoonGamePage = () => {
  const navigate = useNavigate();
  const params = useParams();
  return (
    <main className="page panel">
      <button className="ghost-btn" onClick={() => navigate('/')}>← Portal</button>
      <h2>{params.gameId?.replace('-', ' ')} is coming soon</h2>
      <p>This tile already uses the shared game registry and route structure, so you can plug in the full game module later.</p>
    </main>
  );
};
