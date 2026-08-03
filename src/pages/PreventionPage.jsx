import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Gamepad2, BrainCircuit, Puzzle, ArrowRight, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const CATEGORIES = ['전체', '식습관', '운동', '수면', '두뇌훈련', '생활습관'];

const GAMES = [
  { id: 1, title: '기억력 카드', desc: '카드를 기억하고 짝을 맞춰보세요.', icon: <BrainCircuit className="w-8 h-8 text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
  { id: 2, title: '퍼즐 맞추기', desc: '조각을 맞춰 그림을 완성해보세요.', icon: <Puzzle className="w-8 h-8 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-100' },
  { id: 3, title: '순서 기억하기', desc: '숫자 또는 색깔 순서를 기억해보세요.', icon: <div className="flex gap-1 text-green-500 font-bold"><span className="bg-green-200 px-1 rounded">1</span><span className="bg-green-200 px-1 rounded">2</span><span className="bg-green-200 px-1 rounded">3</span></div>, color: 'bg-green-50 border-green-100' },
  { id: 4, title: '단어 기억하기', desc: '단어를 읽고 기억해보세요.', icon: <Gamepad2 className="w-8 h-8 text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
];

export default function PreventionPage() {
  const navigate = useNavigate();
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // 오늘의 추천 가져오기 (전체 카테고리 무관)
      const { data: featuredData } = await supabase
        .from('posts')
        .select('*')
        .eq('is_featured', true)
        .order('published_at', { ascending: false });
      
      setFeaturedPosts(featuredData || []);

      // 최신 정보 가져오기 (카테고리 필터)
      let query = supabase.from('posts').select('*').order('published_at', { ascending: false });
      
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

  const currentFeatured = featuredPosts[currentFeaturedIndex];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-10">
        
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
              <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
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
        <section className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                selectedCategory === cat 
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
            <h2 className="text-xl font-bold text-slate-800">최신 정보</h2>
            <button className="text-blue-600 text-sm font-bold flex items-center hover:underline">
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
        <section className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">예방 게임으로 두뇌 운동하기</h2>
            <button className="text-blue-600 text-sm font-bold flex items-center hover:underline">
              모든 게임 보기 <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GAMES.map(game => (
              <div key={game.id} className={`p-4 rounded-2xl flex flex-col items-center text-center border ${game.color} hover:shadow-md transition-shadow cursor-pointer`}>
                <div className="h-16 flex items-center justify-center mb-2">
                  {game.icon}
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{game.title}</h4>
                <p className="text-[10px] text-slate-500 mb-4">{game.desc}</p>
                <button className="mt-auto px-4 py-1.5 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-50 w-full transition-colors">
                  게임 시작
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 배너 */}
        <section className="bg-blue-50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full text-blue-500 shadow-sm">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">작은 습관이 큰 변화를 만듭니다</h3>
              <p className="text-sm text-slate-600 mt-1">매일 10분의 실천으로 건강한 두뇌를 지켜주세요.</p>
            </div>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap shadow-md shadow-blue-200">
            오늘의 미션 확인하기 <ChevronRight className="w-4 h-4" />
          </button>
        </section>
        
      </div>
    </div>
  );
}
