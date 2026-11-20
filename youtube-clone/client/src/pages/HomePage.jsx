import { useEffect, useState } from 'react';
import api from '../lib/api';
import VideoGrid from '../components/VideoGrid';

const categories = ['All', 'Music', 'Gaming', 'Live', 'Programming', 'Podcasts', 'Technology', 'Comedy', 'News', 'Sports', 'Recently uploaded'];
export default function HomePage() {
  const [category, setCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; setLoading(true);
    api.get('/videos', { params: { category: category === 'Recently uploaded' ? 'All' : category, sort: category === 'Recently uploaded' ? 'newest' : undefined } })
      .then(({ data }) => { if (active) setVideos(data.videos); })
      .catch(() => { if (active) setVideos([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category]);
  return <div className="page home-page">
    <div className="category-bar">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`category-chip ${category === item ? 'selected' : ''}`}>{item}</button>)}</div>
    <div className="page-inner"><VideoGrid videos={videos} loading={loading} empty="No videos yet"/></div>
  </div>;
}
