import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
import HeroFilm from '../components/HeroFilm.jsx';
import Manifesto from '../sections/Manifesto.jsx';
import Atelier, { TOPIC_CHIPS } from '../sections/Atelier.jsx';
import Archive from '../sections/Archive.jsx';
import Method from '../sections/Method.jsx';
import Marquee from '../sections/Marquee.jsx';
import Footer from '../sections/Footer.jsx';
import { setActivePaper, getArchive, addToArchive, removeFromArchive } from '../utils/storage.js';
import { setEngineModel } from '../hooks/useEngine.js';
import { scrollToTarget } from '../lib/smoothScroll.js';

export default function Home({ ready = true }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const [papers, setPapers] = useState(() => getArchive());

  // Arriving from another page via /#archive etc.
  useEffect(() => {
    if (!location.hash) return undefined;
    const id = setTimeout(() => scrollToTarget(location.hash, { offset: -40 }), 500);
    return () => clearTimeout(id);
  }, [location.hash]);

  const goAtelier = () => scrollToTarget('#atelier', { offset: -40 });
  const goArchive = () => scrollToTarget('#archive', { offset: -40 });

  function pickTopic(t) {
    setTopic(t);
    goAtelier();
  }

  async function handleGenerate() {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error('Name a subject to compose a paper');
      document.getElementById('topic')?.focus();
      return;
    }

    setLoading(true);
    try {
      // 1. Generate questions
      const { data: genData } = await api.post('/generate', {
        topic: trimmed,
        difficulty: difficulty.toLowerCase(),
        count,
      });

      const generated = genData.data;
      setEngineModel(genData.model);

      // 2. Save to this browser's archive
      const paper = addToArchive({
        title: generated.title,
        topic: trimmed,
        difficulty: difficulty.toLowerCase(),
        count: generated.questions.length,
        questions: generated.questions,
      });

      // 3. Store in localStorage + navigate
      setActivePaper(paper);
      toast.success(genData.model?.label ? `Composed by ${genData.model.label}` : 'Paper composed');
      navigate(`/quiz/${paper.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to generate questions. Check your Groq API key.');
    } finally {
      setLoading(false);
    }
  }

  function handleRetake(paper) {
    setActivePaper(paper);
    navigate(`/quiz/${paper.id}`);
  }

  function handleDelete(paperId) {
    removeFromArchive(paperId);
    setPapers((p) => p.filter((x) => x.id !== paperId));
    toast.success('Paper removed from the archive');
  }

  return (
    <>
      <AnimatePresence>{loading && <LoadingScreen topic={topic} count={count} difficulty={difficulty} />}</AnimatePresence>

      <HeroFilm ready={ready} onCompose={goAtelier} onArchive={goArchive} />
      <Manifesto paperCount={papers.length} />
      <Atelier
        topic={topic}
        setTopic={setTopic}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        count={count}
        setCount={setCount}
        loading={loading}
        onGenerate={handleGenerate}
      />
      <Archive papers={papers} loading={false} onRetake={handleRetake} onDelete={handleDelete} onCompose={goAtelier} />
      <Marquee topics={TOPIC_CHIPS} onPick={pickTopic} />
      <Method />
      <Footer onCompose={goAtelier} />
    </>
  );
}
