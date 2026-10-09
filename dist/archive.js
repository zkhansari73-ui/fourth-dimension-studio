(function(){
  const requested=new URLSearchParams(location.search).get('section');
  const section=['articles','news','projects','tutorials'].includes(requested)?requested:(document.body.dataset.section||'articles');
  const copy={
    fa:{articles:'مقالات',news:'اخبار',projects:'پروژه‌ها',tutorials:'آموزش‌ها',intro:'آرشیوی مستقل، قابل جست‌وجو و فیلترشونده از محتوای Fourth Dimension Studio.',search:'جست‌وجو در عنوان، توضیح و تگ‌ها…',allTopic:'همه موضوع‌ها',allSoftware:'همه نرم‌افزارها',allField:'همه حوزه‌ها',allDate:'همه تاریخ‌ها',newest:'جدیدترین',oldest:'قدیمی‌ترین',result:'نتیجه',empty:'موردی مطابق فیلترها پیدا نشد.',open:'مشاهده ←'},
    en:{articles:'Articles',news:'News',projects:'Projects',tutorials:'Tutorials',intro:'A dedicated, searchable and filterable archive of Fourth Dimension Studio content.',search:'Search titles, descriptions and tags…',allTopic:'All topics',allSoftware:'All software',allField:'All fields',allDate:'Any date',newest:'Newest',oldest:'Oldest',result:'results',empty:'No content matches these filters.',open:'Open →'},
    ar:{articles:'المقالات',news:'الأخبار',projects:'المشاريع',tutorials:'الدروس',intro:'أرشيف مستقل وقابل للبحث والتصفية لمحتوى Fourth Dimension Studio.',search:'ابحث في العناوين والوصف والوسوم…',allTopic:'كل المواضيع',allSoftware:'كل البرامج',allField:'كل المجالات',allDate:'كل التواريخ',newest:'الأحدث',oldest:'الأقدم',result:'نتيجة',empty:'لا يوجد محتوى مطابق لهذه المرشحات.',open:'عرض ←'}
  };
  const descriptions={
    fa:{articles:'آرشیو مقالات تخصصی معماری، هوش مصنوعی و طراحی دیجیتال Fourth Dimension Studio',news:'اخبار کوتاه، منبع‌دار و بررسی‌شده معماری، هوش مصنوعی و فناوری',projects:'پروژه‌های معماری، BIM، رندر و طراحی دیجیتال Fourth Dimension Studio',tutorials:'آموزش معماری، نرم‌افزار، طراحی و هوش مصنوعی'},
    en:{articles:'Expert articles on architecture, artificial intelligence and digital design.',news:'Verified and source-linked news on architecture, AI and technology.',projects:'Architecture, BIM, visualization and digital design projects.',tutorials:'Tutorials on architecture, software, design and artificial intelligence.'},
    ar:{articles:'مقالات متخصصة في العمارة والذكاء الاصطناعي والتصميم الرقمي.',news:'أخبار موثقة وموجزة عن العمارة والذكاء الاصطناعي والتقنية.',projects:'مشاريع العمارة وBIM والإظهار والتصميم الرقمي.',tutorials:'دروس العمارة والبرامج والتصميم والذكاء الاصطناعي.'}
  };
  const requestedLang=new URLSearchParams(location.search).get('lang');
  let lang=/^(fa|en|ar)$/.test(requestedLang)?requestedLang:(localStorage.getItem('fd-language')||'fa');
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const staticItems=Array.isArray(window.FD_CONTENT)?window.FD_CONTENT:[];
  let items=staticItems.filter(x=>x.type===section);
  const stripHtml=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  const wpPostToNews=post=>({
    type:'news',
    date:String(post.date||'').slice(0,10),
    topic:'architecture',
    software:'AI',
    field:'technology',
    title:{fa:stripHtml(post.title?.rendered),en:stripHtml(post.title?.rendered),ar:stripHtml(post.title?.rendered)},
    excerpt:{fa:stripHtml(post.excerpt?.rendered),en:stripHtml(post.excerpt?.rendered),ar:stripHtml(post.excerpt?.rendered)},
    tags:['News','WordPress'],
    url:post.link
  });
  const options=(key)=>[...new Set(items.map(x=>x[key]).filter(Boolean))].sort();
  function fill(id,values,label){const el=$(id);el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${v}">${v}</option>`).join('')}
  function setLanguage(next){lang=next;localStorage.setItem('fd-language',lang);document.documentElement.lang=lang;document.body.dir=lang==='en'?'ltr':'rtl';$$('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));$$('.content-nav a').forEach(a=>a.textContent=copy[lang][a.dataset.section]);$('#title').textContent=copy[lang][section];$('#intro').textContent=copy[lang].intro;$('#search').placeholder=copy[lang].search;fill('#topic',options('topic'),copy[lang].allTopic);fill('#software',options('software'),copy[lang].allSoftware);fill('#field',options('field'),copy[lang].allField);fill('#date',[...new Set(items.map(x=>x.date.slice(0,4)))],copy[lang].allDate);$('#sort').innerHTML=`<option value="new">${copy[lang].newest}</option><option value="old">${copy[lang].oldest}</option>`;const canonical=`https://fourth-dimension-studio.infinityfreeapp.com/${section}/?lang=${lang}`;document.title=`${copy[lang][section]} | Fourth Dimension Studio`;document.querySelector('meta[name="description"]').content=descriptions[lang][section];document.querySelector('link[rel="canonical"]').href=canonical;document.querySelector('meta[property="og:title"]').content=document.title;document.querySelector('meta[property="og:description"]').content=descriptions[lang][section];document.querySelector('meta[property="og:url"]').content=canonical;const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState({},'',url);render()}
  function render(){const q=$('#search').value.trim().toLocaleLowerCase();let rows=items.filter(x=>{const hay=[x.title[lang],x.excerpt[lang],...(x.tags||[])].join(' ').toLocaleLowerCase();return(!q||hay.includes(q))&&(!$('#topic').value||x.topic===$('#topic').value)&&(!$('#software').value||x.software===$('#software').value)&&(!$('#field').value||x.field===$('#field').value)&&(!$('#date').value||x.date.startsWith($('#date').value))});rows.sort((a,b)=>$('#sort').value==='old'?a.date.localeCompare(b.date):b.date.localeCompare(a.date));$('#count').textContent=`${rows.length} ${copy[lang].result}`;$('#grid').innerHTML=rows.length?rows.map(x=>`<article class="content-card"><small>${x.date} · ${x.software}</small><h2>${x.title[lang]}</h2><p>${x.excerpt[lang]}</p><div class="tags">${x.tags.map(t=>`<span>${t}</span>`).join('')}</div><a href="${x.url}">${copy[lang].open}</a></article>`).join(''):`<div class="empty">${copy[lang].empty}</div>`}
  async function loadPublishedNews(){
    if(section!=='news') return;
    try{
      const endpoint=new URL('../wp-json/wp/v2/posts',location.href);
      endpoint.searchParams.set('per_page','20');
      endpoint.searchParams.set('status','publish');
      endpoint.searchParams.set('orderby','date');
      endpoint.searchParams.set('order','desc');
      const response=await fetch(endpoint,{credentials:'same-origin'});
      if(!response.ok) throw new Error(`WordPress news request failed: ${response.status}`);
      const posts=await response.json();
      const seen=new Set();
      items=[...posts.map(wpPostToNews),...staticItems.filter(x=>x.type==='news')].filter(item=>{
        if(!item.url||seen.has(item.url)) return false;
        seen.add(item.url); return true;
      });
      setLanguage(lang);
    }catch(error){
      console.warn('Fourth Dimension news archive could not load live WordPress posts.',error);
    }
  }
  $$('input,select').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));$$('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));$$('.content-nav a').forEach(a=>a.classList.toggle('active',a.dataset.section===section));setLanguage(lang);loadPublishedNews();
})();
