import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import api from '../lib/api';
import VideoGrid from '../components/VideoGrid';
export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); api.get('/videos', { params: { q: query, limit: 60 } }).then(({ data }) => setVideos(data.videos)).catch(() => setVideos([])).finally(() => setLoading(false)); }, [query]);
  return <div className="page search-page"><div className="search-result-heading"><span>Search results for <b>“{query}”</b></span><button className="text-button"><SlidersHorizontal size={18}/> Filters</button></div><VideoGrid videos={videos} loading={loading} empty={`No results for “${query}”`}/></div>;
}
