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
  const [breakingNews, setBreakingNews] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState("NEWS"); 

  // STATE BARU UNTUK AUTH & PROFIL
  const [session, setSession] = useState(null); // Sesi Supabase Auth
  const [userProfile, setUserProfile] = useState(null); // Data dari tabel 'profiles'
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' atau 'SIGNUP'
  const [authError, setAuthError] = useState(''); // Pesan error Autentikasi

  // STATE UNTUK HARGA DAN PENCARIAN
  const [prices, setPrices] = useState({ btc: null, eth: null }); 
  const [searchQuery, setSearchQuery] = useState('');


  // Kategori News dan Research
  const categories = ["ALL", "BREAKING", "REGULATION", "CRYPTO", "BITCOIN", "DeFi", "AI"]; 
  const researchCategories = ["ALL", "ALTCOINS", "MARKET ANALYSIS"]; 
  const researchContentCategories = ["ALTCOINS", "MARKET ANALYSIS"]; 


  /************************************
   * CORE FUNCTIONS: DATA & PRICE FETCH
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
      setBreakingNews(data.filter(a => a.category === "BREAKING")); 

    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cethereum&vs_currencies=usd&include_24hr_change=true';
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch prices');
        const data = await response.json();

        setPrices({
            btc: data.bitcoin,
            eth: data.ethereum
        });

    } catch (error) {
        console.error("Error fetching prices:", error);
        // Fallback data
        setPrices({
            btc: { usd: 60000, usd_24h_change: 1.5 },
            eth: { usd: 3500, usd_24h_change: -0.8 }
        });
    }
  };


  const handleViewArticle = (article) => {
    if (article.document_url) {
        window.open(article.document_url, '_blank');
        window.location.hash = `#article/${article.id}`; 
        return; 
    }
    setSelectedArticle(article);
    window.location.hash = `#article/${article.id}`;
  };

  
  /************************************
   * CORE FUNCTIONS: AUTH & PROFILE
   ************************************/

  // 1. Mengambil data profil dari tabel 'profiles'
  const getProfile = async (userId) => {
    if (!userId) return setUserProfile(null);
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, is_subscribed')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows found

        if (data) {
            setUserProfile(data);
        } else {
            // Jika profil belum ada (misalnya user baru sign up), buatkan entry dasar
            const newProfileData = { id: userId, username: 'User Baru', is_subscribed: false };
            const { error: insertError } = await supabase.from('profiles').insert(newProfileData);
            if (insertError) throw insertError;
            setUserProfile(newProfileData);
        }
    } catch (error) {
        console.error('Error fetching/creating profile:', error.message);
    }
  };

  // 2. Auth Handlers
  const handleAuth = async (email, password, isSignUp, username) => {
    setAuthError('');
    try {
        let response;
        if (isSignUp) {
            response = await supabase.auth.signUp({ email, password, options: { data: { username } } });
        } else {
            response = await supabase.auth.signInWithPassword({ email, password });
        }

        const { error, data } = response;

        if (error) {
            setAuthError(error.message);
            return;
        }

        if (isSignUp) {
            alert('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
        }

        // Jika berhasil login, sesi akan diupdate oleh listener
    } catch (e) {
        setAuthError(e.message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
    } else {
        setUserProfile(null);
        setSession(null);
        setCurrentPage('NEWS'); // Kembali ke halaman utama
    }
  };
  
  // 3. Update Profile Handlers
  const updateUserName = async (newUsername) => {
    if (!session || !userProfile) return;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ username: newUsername })
            .eq('id', session.user.id);
        
        if (error) throw error;
        
        setUserProfile(prev => ({ ...prev, username: newUsername }));
        alert('Nama berhasil diubah!');
    } catch (error) {
        console.error('Error updating username:', error.message);
        alert('Gagal mengubah nama: ' + error.message);
    }
  };

  const toggleSubscription = async () => {
    if (!session || !userProfile) return;
    const newSubStatus = !userProfile.is_subscribed;

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_subscribed: newSubStatus })
            .eq('id', session.user.id);
        
        if (error) throw error;
        
        setUserProfile(prev => ({ ...prev, is_subscribed: newSubStatus }));
        alert(`Langganan ${newSubStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);

    } catch (error) {
        console.error('Error updating subscription:', error.message);
        alert('Gagal mengubah status langganan: ' + error.message);
    }
  };


  /************************************
   * SIDE EFFECTS & DATA FETCHING
   ************************************/
  useEffect(() => {
    loadArticles();
    fetchPrices(); 

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) getProfile(session.user.id);
    });

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            setSession(session);
            if (session) {
                getProfile(session.user.id);
            } else {
                setUserProfile(null);
            }
        }
    );

    const initialHash = window.location.hash;
    if (initialHash.startsWith("#research")) {
        setCurrentPage("RESEARCH");
    } else if (initialHash.startsWith("#profile")) {
        setCurrentPage("PROFILE");
    }
    
    const interval = setInterval(fetchPrices, 60000); 
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    }; 
  }, []);

  // ... (URL routing logic tetap sama) ...
  useEffect(() => {
    // ... (logic untuk article detail hash) ...
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
        } else if (newHash === "#profile") {
          setCurrentPage("PROFILE");
        } else if (newHash === "#research") {
          setCurrentPage("RESEARCH");
        } else {
          setSelectedArticle(null);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [articles]);

  
  /************************************
   * FILTER LIST
   ************************************/
  const finalArticlesToRender = articles.filter(a => {
    let categoryMatch = false;
    if (currentPage === "NEWS") {
        categoryMatch = selectedCategory === "ALL" || a.category === selectedCategory;
    } else if (currentPage === "RESEARCH") {
        const isResearchCategory = researchContentCategories.includes(a.category);
        const selectedResearchCategoryMatch = selectedCategory === "ALL" || a.category === selectedCategory;
        categoryMatch = isResearchCategory && selectedResearchCategoryMatch;
    } else {
        return false; // Tidak tampilkan artikel di halaman PROFILE
    }

    if (!categoryMatch) return false;

    if (searchQuery.length > 0) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (a.title || a.tittle).toLowerCase().includes(query);
        return titleMatch; 
    }
    
    return true; 
  });


  /************************************
   * RENDERING: COMPONENTS
   ************************************/
  
  // Price Ticker Component
  const PriceTicker = ({ prices }) => {
    // ... (Kode PriceTicker tetap sama) ...
    const formatPrice = (price) => `$${(price.usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    const formatChange = (change) => change.toFixed(2);

    const renderCoin = (name, priceData) => {
        if (!priceData) return null;

        const change = priceData.usd_24h_change;
        const changeClass = change >= 0 ? 'text-green-500' : 'text-red-500';
        const changeIcon = change >= 0 ? 'mdi:arrow-up' : 'mdi:arrow-down';

        return (
            <div className="flex items-center gap-1">
                <span className="text-gray-400 font-semibold">{name}</span>
                <span className="text-white font-bold text-sm">{formatPrice(priceData)}</span>
                <span className={`flex items-center text-xs ${changeClass}`}>
                    <span className="iconify text-sm" data-icon={changeIcon}></span>
                    {formatChange(change)}%
                </span>
            </div>
        );
    };

    return (
        <div className="bg-zinc-800 p-2 overflow-x-auto whitespace-nowrap"> 
            <div className="flex gap-4">
                {renderCoin('BTC/USD', prices.btc)}
                {renderCoin('ETH/USD', prices.eth)}
            </div>
        </div>
    );
  };
  
  // Search Bar Component
  const SearchBar = () => (
    <div className="relative mt-3"> 
      <input
        type="text"
        placeholder="Cari berita atau research..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full py-2 pl-10 pr-4 bg-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
      />
      <span className="iconify absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" data-icon="mdi:magnify"></span>
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <span className="iconify" data-icon="mdi:close-circle-outline"></span>
        </button>
      )}
    </div>
  );

  // KOMPONEN BARU: Auth Form (Login/Signup)
  const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const isSignUp = authMode === 'SIGNUP';

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAuth(email, password, isSignUp, username);
    };

    return (
        <div className="p-4 max-w-sm mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
                {isSignUp ? 'Buat Akun Baru' : 'Masuk ke Akun Anda'}
            </h2>
            
            {authError && (
                <p className="bg-red-900 text-red-300 p-3 rounded mb-4 text-sm">{authError}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <input
                        type="text"
                        placeholder="Nama Pengguna (Wajib)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 focus:ring-cyan-400 focus:border-cyan-400"
                    />
                )}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 focus:ring-cyan-400 focus:border-cyan-400"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 bg-zinc-800 rounded border border-zinc-700 focus:ring-cyan-400 focus:border-cyan-400"
                />
                
                <button
                    type="submit"
                    className="w-full bg-cyan-400 text-black font-bold py-3 rounded-lg hover:bg-cyan-300 transition duration-150"
                >
                    {isSignUp ? 'Daftar Sekarang' : 'Masuk'}
                </button>
            </form>

            <div className="text-center mt-4">
                <button 
                    onClick={() => {
                        setAuthMode(isSignUp ? 'LOGIN' : 'SIGNUP');
                        setAuthError('');
                    }}
                    className="text-cyan-400 text-sm hover:underline"
                >
                    {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
                </button>
            </div>
        </div>
    );
  };

  // KOMPONEN BARU: Settings Section (Logged In)
  const SettingsSection = ({ profile }) => {
    const [newUsername, setNewUsername] = useState(profile?.username || '');

    const handleNameUpdate = (e) => {
        e.preventDefault();
        updateUserName(newUsername);
    };

    return (
        <div className="p-4 max-w-xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-center">Halo, {profile?.username || 'Pengguna'}!</h2>
            <p className="text-center text-gray-400">Email: {session?.user?.email}</p>

            {/* Bagian Ganti Nama */}
            <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                <h3 className="text-xl font-semibold mb-3">1. Ganti Nama Pengguna</h3>
                <form onSubmit={handleNameUpdate} className="flex gap-2">
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Nama Pengguna Baru"
                        required
                        className="flex-grow p-3 bg-zinc-800 rounded border border-zinc-700"
                    />
                    <button
                        type="submit"
                        className="bg-cyan-400 text-black px-4 py-3 rounded-lg font-semibold"
                    >
                        Ubah
                    </button>
                </form>
            </div>

            {/* Bagian Subscribe Newsletter */}
            <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800 flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">2. Langganan Newsletter</h3>
                    <p className="text-gray-400 text-sm mt-1">Dapatkan ringkasan berita mingguan ke email Anda.</p>
                </div>
                <button
                    onClick={toggleSubscription}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition duration-150 ${
                        profile?.is_subscribed ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}
                >
                    {profile?.is_subscribed ? 'Berhenti' : 'Langganan'}
                </button>
            </div>

            {/* Bagian Notifikasi (Placeholder) */}
            <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800">
                <h3 className="text-xl font-semibold mb-3">3. Notifikasi Ponsel</h3>
                <p className="text-yellow-500 text-sm mb-3">
                    <span className="iconify mr-1" data-icon="mdi:alert-circle-outline"></span> 
                    Fitur ini memerlukan izin perangkat khusus dan konfigurasi server.
                </p>
                <div className="flex justify-between items-center">
                    <p className="text-gray-400">Status Notifikasi</p>
                    <span className="text-red-500 font-semibold flex items-center gap-1">
                        <span className="iconify text-lg" data-icon="mdi:close-circle"></span> Nonaktif
                    </span>
                </div>
            </div>


            {/* Tombol Logout */}
            <div className="text-center pt-4 border-t border-zinc-800">
                <button
                    onClick={handleSignOut}
                    className="text-red-500 font-semibold flex items-center justify-center gap-2 p-3 w-full max-w-xs mx-auto rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
                >
                    <span className="iconify text-xl" data-icon="mdi:logout"></span>
                    Keluar / Ganti Akun
                </button>
            </div>
        </div>
    );
  };


  // KOMPONEN BARU: Profile Page
  const ProfilePage = () => {
    return (
        <div className="min-h-screen bg-black text-white pb-20 pt-4">
            <h1 className="text-3xl font-bold text-center mb-6">Profil Saya</h1>
            {session && userProfile ? (
                <SettingsSection profile={userProfile} />
            ) : (
                <AuthForm />
            )}
        </div>
    );
  };


  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around p-3 text-sm z-50">
      {/* Tombol NEWS */}
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

      {/* Tombol RESEARCH */}
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

      {/* Tombol PROFILE */}
      <button
        onClick={() => {
            setCurrentPage("PROFILE");
            window.location.hash = "#profile";
            setSelectedCategory("ALL");
        }}
        className={`flex flex-col items-center gap-1 ${currentPage === "PROFILE" ? 'text-cyan-400' : 'text-gray-500'}`}
      >
        <span className="iconify text-xl" data-icon="mdi:account-circle-outline"></span>
        {session ? 'Profil' : 'Masuk'}
      </button>
    </div>
  );

  const ArticleListRenderer = ({ isResearch = false }) => {
    // ... (Kode ArticleListRenderer untuk NEWS/RESEARCH) ...
    const activeCategories = isResearch ? researchCategories : categories;
    const articlesToRender = finalArticlesToRender; 
    
    const headerTitle = isResearch ? 'Research & Analysis' : 'Indonesia';
    const mainTitle = isResearch ? 'ALL RESEARCH' : 'ALL NEWS';
    
    
    return (
      <div className="pb-20"> 
        <div className="sticky top-0 bg-zinc-900 z-10">
          
          <PriceTicker prices={prices} />

          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center">
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

            <SearchBar />
          </div>

          <div className="flex gap-2 overflow-x-auto p-4 pt-0 pb-4 border-b border-zinc-800">
            {activeCategories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedCategory(c);
                  setSearchQuery(''); 
                }}
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
        
        {/* BREAKING NEWS SLIDER */}
        {currentPage === "NEWS" && breakingNews.length > 0 && selectedCategory === "ALL" && searchQuery.length === 0 && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">BREAKING NEWS</h2>
            <div className="flex overflow-x-scroll space-x-4 pb-4 snap-x snap-mandatory">
              {breakingNews.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg overflow-hidden cursor-pointer w-[85vw] flex-shrink-0 snap-center" 
                  onClick={() => handleViewArticle(t)}
                >
                  <div className="relative">
                    <img src={t.thumbnail} className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
                      <div className="w-full">
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

        {/* TOP NEWS SLIDER */}
        {currentPage === "NEWS" && topNews.length > 0 && selectedCategory === "ALL" && searchQuery.length === 0 && (
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
          <h2 className="text-xl font-bold mb-4">
            {searchQuery.length > 0 ? `HASIL PENCARIAN (${finalArticlesToRender.length})` : mainTitle}
          </h2>
          
          {articlesToRender.length === 0 ? (
            <p className="text-center text-gray-500">
              {searchQuery.length > 0 
                ? 'Tidak ada artikel yang cocok dengan pencarian Anda.' 
                : `Belum ada ${isResearch ? 'research' : 'artikel'} untuk kategori ini.`}
            </p>
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
                    <div className="flex gap-3">
                        <img src={a.thumbnail} className="w-28 h-20 object-cover rounded" />
                        <div>
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

  // Tampilkan Detail Artikel
  if (selectedArticle) {
    // ... (Kode Detail View tetap sama) ...
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

  // Tampilkan Halaman Utama
  return (
    <div className="min-h-screen bg-black text-white">
      {currentPage === "NEWS" && <ArticleListRenderer isResearch={false} />}
      {currentPage === "RESEARCH" && <ArticleListRenderer isResearch={true} />}
      {currentPage === "PROFILE" && <ProfilePage />}
      
      <BottomNav />
    </div>
  );
}