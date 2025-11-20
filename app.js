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
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedArticle, setSelectedArticle] = useState(null);

  // State yang TIDAK TERPAKAI (dihapus/dinonaktifkan)
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser] = useState(null);

  const categories = ["ALL", "REGULATION", "CRYPTO", "BITCOIN", "DeFi", "AI"];


  /************************************
   * LOAD ARTICLES FROM SUPABASE
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
      setTopNews(data.filter(a => a.isTopNews));
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);


  /************************************
   * SUBSCRIBE POPUP (Dinonaktifkan, tapi fungsi utama masih ada)
   ************************************/
  const handleSubscribe = () => {
    if (!email) return alert("Masukkan email!");
    setSubscribeSuccess(true);
    setTimeout(() => {
      setShowSubscribe(false);
      setSubscribeSuccess(false);
      setEmail("");
    }, 1500);
  };


  /************************************
   * FILTER LIST
   ************************************/
  const filteredArticles =
    selectedCategory === "ALL"
      ? articles
      : articles.filter(a => a.category === selectedCategory);


  /************************************
   * RENDERING: LOADING SCREEN
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

  // RENDER LOGIN SCREEN DAN ADMIN PANEL DIHAPUS

  /************************************
   * ARTICLE DETAIL VIEW
   ************************************/
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-black text-white">

        <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-cyan-400 flex items-center gap-2"
          >
            ← Kembali
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <img src={selectedArticle.thumbnail} className="w-full h-64 object-cover rounded mb-4" />

          <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
            {selectedArticle.category}
          </span>

          <h1 className="text-3xl font-bold mt-3 mb-4">
            {selectedArticle.title}
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


  /************************************
   * HOME — LIST VIEW
   ************************************/
  return (
    <div className="min-h-screen bg-black text-white pb-20">

      <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800">
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
              <p className="text-xs text-gray-400">Indonesia</p>
            </div>
          </div>

          {/* Tombol Login Admin dihapus dari sini */}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-sm ${
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

      {topNews.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2">TOP NEWS</h2>
          <div className="space-y-4">
            {topNews.map((t) => (
              <div
                key={t.id}
                className="rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedArticle(t)}
              >
                <img
                  src={t.thumbnail}
                  className="w-full h-56 object-cover"
                />
                <div className="p-3 bg-zinc-900">
                  <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
                    {t.category}
                  </span>
                  <h3 className="text-xl font-bold mt-2">{t.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">ALL NEWS</h2>

        {filteredArticles.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada artikel</p>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className="bg-zinc-900 rounded p-3 cursor-pointer hover:bg-zinc-800"
              >
                <div className="flex gap-3">
                  <img src={a.thumbnail} className="w-28 h-20 object-cover rounded" />

                  <div>
                    <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
                      {a.category}
                    </span>
                    <h3 className="font-bold mt-2 line-clamp-2">{a.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {a.author} • {a.Readtime}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}