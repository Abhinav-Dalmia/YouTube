import { Link, useParams } from 'react-router-dom';
export default function PlaceholderPage() {
  const { section } = useParams();
  const title = section ? section[0].toUpperCase() + section.slice(1) : 'This page';
  return <div className="page"><div className="empty-state"><div className="empty-icon">▶</div><h3>{title} is coming together</h3><p>This section is part of the YouTube-style interface. Its core data workflows can be added next.</p><Link to="/" className="primary-button">Back to home</Link></div></div>;
}
