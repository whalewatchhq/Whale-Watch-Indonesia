const SUPABASE_URL = "https://alojkucjsykmyhbxxnlw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsb2prdWNqc3lrbXloYnh4bmx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDI3NzUsImV4cCI6MjA3OTIxODc3NX0.psF4Ip4wdLt6qxcKIplBk1fg37uQMwXtY5ew7fQS1eY";

const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const { useState, useEffect } = React;

function WhaleWatchApp() {

  /************************************
   * REACT STATES
   ************************************/
  const [articles, setArticles] = useState([]);
  const [topNews, setTopNews] = useState([]);
  // STATE BARU untuk Breaking News
  const [breakingNews, setBreakingNews] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState("NEWS"); 

  const [showSubscribe] = useState(false);
  const [email] = useState("");
  const [subscribeSuccess] = useState(false);
  const [currentUser] = useState(null);

  // Kategori News dan Research
  // MENAMBAH KATEGORI BARU 'BREAKING'
  const categories = ["ALL", "BREAKING", "REGULATION", "CRYPTO", "BITCOIN", "DeFi", "AI"]; 
  const researchCategories = ["ALL", "ALTCOINS", "MARKET ANALYSIS"]; 
  const researchContentCategories = ["ALTCOINS", "MARKET ANALYSIS"]; 


  /************************************
   * CORE FUNCTIONS
   ************************************/
  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      setArticles(data);
      // Memisahkan Top News (isTopNews=TRUE)
      setTopNews(data.filter(a => a.isTopNews)); 
      // Memisahkan Breaking News (category='BREAKING')
      setBreakingNews(data.filter(a => a.category === "BREAKING")); 

    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArticle = (article) => {
    // 1. Cek apakah ada URL dokumen.
    if (article.document_url) {
        window.open(article.document_url, '_blank');
        window.location.hash = `#article/${article.id}`; 
        return; 
    }
    
    // 2. Jika tidak ada URL dokumen (yaitu, News), tampilkan detail internal
    setSelectedArticle(article);
    window.location.hash = `#article/${article.id}`;
  };

  const handleSubscribe = () => {};


  /************************************
   * URL ROUTING (HASH) LOGIC
   ************************************/
  useEffect(() => {
    loadArticles();
    const initialHash = window.location.hash;
    if (initialHash.startsWith("#research")) {
        setCurrentPage("RESEARCH");
    }
  }, []);

  useEffect(() => {
    if (articles.length > 0) {
      const hash = window.location.hash;
      if (hash.startsWith("#article/")) {
        const id = hash.split("/")[1];
        const article = articles.find(a => a.id.toString() === id);
        if (article) {
          if (article.document_url) {
            setSelectedArticle(null); 
          } else {
            setSelectedArticle(article);
          }
        }
      }

      const handleHashChange = () => {
        const newHash = window.location.hash;
        if (newHash.startsWith("#article/")) {
          const id = newHash.split("/")[1];
          const article = articles.find(a => a.id.toString() === id);
          if (article && !article.document_url) {
             setSelectedArticle(article);
          } else {
             setSelectedArticle(null);
          }
        } else if (newHash === "") {
          setSelectedArticle(null);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [articles]);

  
  /************************************
   * FILTER LIST (STRICT CONTENT SEPARATION)
   ************************************/
  const finalArticlesToRender = articles.filter(a => {
    // 1. Jika di halaman NEWS:
    if (currentPage === "NEWS") {
        return selectedCategory === "ALL" || a.category === selectedCategory;
    }
    
    // 2. Jika di halaman RESEARCH:
    if (currentPage === "RESEARCH") {
        
        if (!researchContentCategories.includes(a.category)) {
            return false;
        }

        if (selectedCategory === "ALL") {
            return true;
        }
        
        return a.category === selectedCategory;
    }
    return false;
  });


  /************************************
   * RENDERING: UTILITY COMPONENTS
   ************************************/

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around p-3 text-sm z-50">
      <button 
        onClick={() => {
            setCurrentPage("NEWS");
            window.location.hash = "";
            setSelectedCategory("ALL");
        }}
        className={`flex flex-col items-center gap-1 ${currentPage === "NEWS" ? 'text-cyan-400' : 'text-gray-500'}`}
      >
        <span className="iconify text-xl" data-icon="mdi:newspaper-variant-outline"></span>
        News
      </button>

      <button
        onClick={() => {
            setCurrentPage("RESEARCH");
            window.location.hash = "#research";
            setSelectedCategory("ALL");
        }}
        className={`flex flex-col items-center gap-1 ${currentPage === "RESEARCH" ? 'text-cyan-400' : 'text-gray-500'}`}
      >
        <span className="iconify text-xl" data-icon="mdi:lightbulb-outline"></span>
        Research
      </button>
    </div>
  );

  const ArticleListRenderer = ({ isResearch = false }) => {
    const activeCategories = isResearch ? researchCategories : categories;
    const articlesToRender = finalArticlesToRender; 
    
    const headerTitle = isResearch ? 'Research & Analysis' : 'Indonesia';
    const mainTitle = isResearch ? 'ALL RESEARCH' : 'ALL NEWS';
    
    // Untuk memfilter Top News dan Breaking News agar tidak muncul lagi di ALL NEWS
    // Filter out articles that are Top News OR Breaking News from the main list
    const articlesForMainList = articlesToRender.filter(a => 
      !a.isTopNews && a.category !== "BREAKING"
    );


    return (
      <div className="pb-20"> 
        <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800 z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-cyan-400 flex items-center justify-center">
                <img 
                  src="https://dtgamxtjzipqrosoobek.supabase.co/storage/v1/object/sign/Branding/whalewatch-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTc5NWExOC1hOWRlLTQxYTEtYTI5NS0zM2FlYjlhNzVkMTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJCcmFuZGluZy93aGFsZXdhdGNoLWxvZ28ucG5nIiwiaWF0IjoxNzYzNDc1NjQ1LCJleHAiOjE3OTUwMTE2NDV9.SuiCmSNdspXZD7U6U8ivQnVI0zhOGQ78p_vvqmesjzM"
                  alt="Whale Watch Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Whale Watch</h1>
                <p className="text-xs text-gray-400">{headerTitle}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {activeCategories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 rounded-full text-sm flex-shrink-0 ${
                  selectedCategory === c
                    ? "bg-cyan-400 text-black"
                    : "bg-zinc-800 text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        
        {/* ======================================================= */}
        {/* NEW: BREAKING NEWS SLIDER (Hanya tampilkan di halaman NEWS) */}
        {/* ======================================================= */}
        {currentPage === "NEWS" && breakingNews.length > 0 && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">BREAKING NEWS</h2>
            <div className="flex overflow-x-scroll space-x-4 pb-4 snap-x snap-mandatory">
              {breakingNews.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg overflow-hidden cursor-pointer w-[85vw] flex-shrink-0 snap-center" 
                  onClick={() => handleViewArticle(t)}
                >
                  {/* Styling sesuai contoh gambar */}
                  <div className="relative">
                    <img src={t.thumbnail} className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
                      <div className="w-full">
                        {/* Menampilkan kategori BREAKING */}
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded"> 
                          {t.category}
                        </span>
                        <h3 className="text-xl font-bold mt-2 text-white line-clamp-2">
                           {t.title || t.tittle}
                        </h3>
                        <p className="text-xs text-gray-200 mt-1">
                          {t.date} | {t.Readtime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP NEWS SLIDER (Hanya tampilkan di halaman NEWS DAN BUKAN BREAKING NEWS) */}
        {currentPage === "NEWS" && topNews.length > 0 && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">TOP NEWS</h2>
            <div className="flex overflow-x-scroll space-x-4 pb-4 snap-x snap-mandatory">
              {topNews.filter(t => t.category !== "BREAKING").map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg overflow-hidden cursor-pointer w-[85vw] flex-shrink-0 snap-center" 
                  onClick={() => handleViewArticle(t)}
                >
                  <img src={t.thumbnail} className="w-full h-56 object-cover" />
                  <div className="p-3 bg-zinc-900">
                    <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
                      {t.category}
                    </span>
                    <h3 className="text-xl font-bold mt-2">{t.title || t.tittle}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL NEWS / ALL RESEARCH LIST */}
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{mainTitle}</h2>
          
          {articlesToRender.length === 0 ? (
            <p className="text-center text-gray-500">Belum ada {isResearch ? 'research' : 'artikel'} untuk kategori ini.</p>
          ) : (
            <div className="space-y-4">
              {articlesToRender.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleViewArticle(a)}
                  className="bg-zinc-900 rounded p-3 cursor-pointer hover:bg-zinc-800"
                >
                  
                  {isResearch ? (
                    // TAMPILAN CARD UNTUK RESEARCH (Full Card)
                    <div className="rounded-lg overflow-hidden">
                        <div className="relative">
                            <img 
                                src={a.thumbnail} 
                                className="w-full h-56 object-cover rounded" 
                            />
                            <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                <span className="iconify" data-icon="mdi:file-document-outline"></span>
                                Research
                            </span>
                        </div>
                        <div className="p-3">
                            <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
                                {a.category}
                            </span>
                            <h3 className="text-xl font-bold mt-2">{a.title || a.tittle}</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {a.date} | {a.Readtime}
                            </p>
                        </div>
                    </div>

                  ) : (
                    // TAMPILAN CARD UNTUK NEWS (Compact List)
                    // Pastikan BREAKING dan Top News yang sudah tampil tidak muncul lagi di sini (Sudah diatasi oleh filter articlesForMainList, tapi saya menggunakan articlesToRender. Kita perlu memfilter lebih lanjut jika ALL dipilih)
                    <div className="flex gap-3">
                        <img src={a.thumbnail} className="w-28 h-20 object-cover rounded" />
                        <div>
                        {/* Jika kategori BREAKING, gunakan warna merah */}
                        <span className={`text-black text-xs px-2 py-1 rounded ${a.category === 'BREAKING' ? 'bg-red-600 text-white' : 'bg-cyan-400'}`}>
                            {a.category}
                        </span>
                        <h3 className="font-bold mt-2 line-clamp-2">{a.title || a.tittle}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {a.author} • {a.Readtime}
                        </p>
                        </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };


  /************************************
   * RENDERING: MAIN APP LOGIC
   ************************************/
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div>
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-center mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Tampilkan Detail Artikel jika ada yang dipilih
  if (selectedArticle) {
    // KODE ARTICLE DETAIL VIEW (tetap sama)
    return (
      <div className="min-h-screen bg-black text-white">

        <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedArticle(null);
              window.location.hash = ""; 
            }}
            className="text-cyan-400 flex items-center gap-2"
          >
            ← Kembali
          </button>
          <button
            onClick={() => {
                const shareUrl = window.location.href; 
                navigator.clipboard.writeText(shareUrl)
                    .then(() => alert("Link Berita telah disalin ke clipboard!"))
                    .catch(() => alert("Gagal menyalin link."));
            }}
            className="bg-cyan-400 text-black px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-sm"
          >
            <span className="iconify" data-icon="mdi:share-variant"></span>
            Share
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <img src={selectedArticle.thumbnail} className="w-full h-64 object-cover rounded mb-4" />

          {/* Menggunakan warna merah jika kategori BREAKING */}
          <span className={`text-black text-xs px-2 py-1 rounded ${selectedArticle.category === 'BREAKING' ? 'bg-red-600 text-white' : 'bg-cyan-400'}`}>
            {selectedArticle.category}
          </span>

          <h1 className="text-3xl font-bold mt-3 mb-4">
            {selectedArticle.title || selectedArticle.tittle}
          </h1>

        <div className="flex gap-4 text-gray-400 text-sm mb-6">
  <span className="flex items-center gap-1">
    <span className="iconify" data-icon="mdi:calendar-month-outline" style={{fontSize:16}}></span>
    {selectedArticle.date}
  </span>

  <span className="flex items-center gap-1">
    <span className="iconify" data-icon="mdi:account-edit-outline" style={{fontSize:16}}></span>
    {selectedArticle.author}
  </span>

  <span className="flex items-center gap-1">
    <span className="iconify" data-icon="mdi:timer-outline" style={{fontSize:16}}></span>
    {selectedArticle.Readtime}
  </span>
</div>

          <div className="text-gray-300 leading-relaxed">
            {selectedArticle.content.split("\n\n").map((p, i) => (
              <p key={i} className="mb-4">{p}</p>
            ))}
          </div>

        </div>

      </div>
    );
  }

  // Tampilkan Halaman NEWS atau RESEARCH
  return (
    <div className="min-h-screen bg-black text-white">
      {currentPage === "NEWS" && <ArticleListRenderer isResearch={false} />}
      {currentPage === "RESEARCH" && <ArticleListRenderer isResearch={true} />}
      
      <BottomNav />
    </div>
  );
}