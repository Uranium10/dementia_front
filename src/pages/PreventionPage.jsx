import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Clock, Gamepad2, BrainCircuit, Puzzle, ArrowRight, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import DailyCheckinCard from '../components/dailyCheckin/DailyCheckinCard';

const CATEGORIES = ['전체', '식습관', '운동', '수면', '두뇌훈련', '생활습관', '연구'];

const GAMES = [
  {
    id: 1,
    title: '스도쿠',
    desc: '스도쿠 퍼즐을 완성하며 논리력을 기르세요.',
    image: '/assets/games/sudoku.png',
    path: '/game/sudoku'
  },
  {
    id: 2,
    title: '색깔 맞추기',
    desc: '글자의 뜻을 찾아 주의력과 억제력을 기르세요.',
    image: '/assets/games/color_match.png',
    path: '/game/color-match'
  },
  {
    id: 3,
    title: '순서 기억하기',
    desc: '나타난 순서를 기억하고 맞춰 실행기능을 돕는 훈련',
    image: '/assets/games/sequence.png',
    path: '/game/sequence'
  },
  {
    id: 4,
    title: '카드 짝 맞추기',
    desc: '숨겨진 카드의 짝을 기억하여 단기 기억력을 향상하세요.',
    image: '/assets/games/card_match_thumbnail.png',
    path: '/game/card-match'
  }
];

export default function PreventionPage() {
  const navigate = useNavigate();
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const gamesScrollRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data: featuredData } = await supabase
        .from('posts')
        .select('*')
        .eq('is_featured', true)
        .order('published_at', { ascending: false });

      setFeaturedPosts(featuredData || []);

      let query = supabase.from('posts').select('*').order('published_at', { ascending: false }).limit(5);

      if (selectedCategory !== '전체') {
        query = query.eq('category', selectedCategory);
      }

      const { data: latestData } = await query;
      setLatestPosts(latestData || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollGames = (direction) => {
    if (gamesScrollRef.current) {
      const scrollAmount = 220;
      gamesScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const nextFeatured = (e) => {
    e.stopPropagation();
    setCurrentFeaturedIndex((prev) => (prev + 1) % featuredPosts.length);
  };

  const prevFeatured = (e) => {
    e.stopPropagation();
    setCurrentFeaturedIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length);
  };

  const currentFeatured = featuredPosts[currentFeaturedIndex];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-10">

        {/* 0. 데일리 체크인 위젯 */}
        {session && <DailyCheckinCard session={session} />}

        {/* 1. 오늘의 추천 (Featured Carousel) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-600 text-white p-1 rounded">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">오늘의 추천</h2>
          </div>

          {currentFeatured ? (
            <div
              onClick={() => navigate(`/post/${currentFeatured.id}`)}
              className="bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-8 items-center relative overflow-hidden group cursor-pointer transition-all hover:shadow-md"
            >
              <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden shrink-0">
                <img
                  src={currentFeatured.thumbnail_url || 'https://via.placeholder.com/600x400'}
                  alt={currentFeatured.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {currentFeatured.category}
                </span>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  {currentFeatured.title}
                </h3>
                <p className="text-slate-500 text-sm">
                  {currentFeatured.summary}
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {currentFeatured.read_minutes}분 읽기</span>
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> AI 추천</span>
                </div>
              </div>
              
              {/* 캐러셀 좌우 컨트롤 버튼 */}
              {featuredPosts.length > 1 && (
                <>
                  <button
                    onClick={prevFeatured}
                    className="absolute left-2 md:left-4 top-[25%] md:top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-white hover:scale-105 transition-all z-10 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="이전 추천글"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextFeatured}
                    className="absolute right-2 md:right-4 top-[25%] md:top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-white hover:scale-105 transition-all z-10 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="다음 추천글"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center text-slate-400 shadow-sm">
              추천 게시글이 없습니다.
            </div>
          )}

          {/* Dots */}
          {featuredPosts.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {featuredPosts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentFeaturedIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === currentFeaturedIndex ? 'bg-blue-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* 2. 카테고리 필터 */}
        <section className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* 3. 최신 정보 리스트 */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">치매 예방 최신 정보</h2>
            <button onClick={() => navigate('/posts')} className="text-blue-600 text-sm font-bold flex items-center hover:underline">
              더보기 <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-4">
            {latestPosts.length > 0 ? latestPosts.map(post => (
              <div
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="flex gap-4 items-center group cursor-pointer border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                      {post.category}
                    </span>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{post.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">{post.summary}</p>
                </div>
                <div className="flex items-center gap-3 text-slate-400 shrink-0">
                  <span className="text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_minutes}분 읽기</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400 text-sm">
                게시글이 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* 4. 예방 게임 */}
        <section className="bg-white rounded-3xl p-6 shadow-sm relative group/section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">🧠두뇌 자극 게임</h2>
            {session && (
              <button onClick={() => navigate('/game-stats')} className="text-blue-600 text-sm font-bold flex items-center hover:underline">
                내 게임 기록 차트 보기 <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>

          <div className="relative">
            {/* 왼쪽 패들 */}
            <button 
              onClick={() => scrollGames('left')}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-20 bg-white/90 border border-slate-200 shadow-md rounded-r-xl flex items-center justify-center opacity-0 group-hover/section:opacity-100 hover:bg-slate-50 hover:text-blue-600 transition-all text-slate-400"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* 스크롤 컨테이너 */}
            <div 
              ref={gamesScrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-2 -mx-2 px-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {GAMES.map(game => (
                <div
                  key={game.id}
                  onClick={() => navigate(game.path)}
                  className="w-40 sm:w-48 shrink-0 snap-start bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="aspect-square bg-slate-50 overflow-hidden relative">
                    <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 flex flex-col flex-1 text-center">
                    <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">{game.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-4 flex-1 line-clamp-2">{game.desc}</p>
                    <button className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors w-full">
                      게임 시작
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 오른쪽 패들 */}
            <button 
              onClick={() => scrollGames('right')}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-20 bg-white/90 border border-slate-200 shadow-md rounded-l-xl flex items-center justify-center opacity-0 group-hover/section:opacity-100 hover:bg-slate-50 hover:text-blue-600 transition-all text-slate-400"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </section>



      </div>
    </div>
  );
}
