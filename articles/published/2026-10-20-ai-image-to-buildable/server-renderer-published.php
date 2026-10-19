<?php
/* Scoped server-rendered article support. No theme files or security settings are changed. */
function fd_ai_article_html_20261020($id) {
    $meta = get_post_meta($id, '_fd_ai_article_meta_20261020', true);
    $lang = isset($_GET['lang']) ? sanitize_key(wp_unslash($_GET['lang'])) : 'en';
    if (!in_array($lang, array('en','fa','ar'), true)) { $lang = 'en'; }
    if (!is_array($meta) || empty($meta['locales'][$lang])) { return ''; }
    $c = $meta['locales'][$lang];
    $raw = get_post_field('post_content', $id, 'raw');
    if (!preg_match('~<!--fd-locale-start:'.$lang.'-->(.*?)<!--fd-locale-end:'.$lang.'-->~s', $raw, $match)) { return ''; }
    $body = wp_kses_post($match[1]);
    $body = preg_replace('~<h2 class="fd-article-title">(.*?)</h2>~s', '<h1 class="fd-article-title">$1</h1>', $body, 1);
    $base = remove_query_arg(array('lang','preview','preview_id','preview_nonce'), get_permalink($id));
    $url = add_query_arg('lang', $lang, $base);
    $archive = add_query_arg(array('section'=>'articles','lang'=>$lang), home_url('/wp-content/themes/fourth-dimension-theme/site/journal/'));
    $home = add_query_arg('lang', $lang, home_url('/'));
    $names = array('en'=>array('Home','Articles','Editorial guide','Image source','About the studio'), 'fa'=>array('خانه','مقاله‌ها','راهنمای تحریریه','فایل تصویر','دربارهٔ استودیو'), 'ar'=>array('الرئيسية','المقالات','دليل تحريري','مصدر الصورة','عن الاستوديو'));
    $t = $names[$lang];
    $links = array();
    foreach (array('en','fa','ar') as $code) { $links[$code] = add_query_arg('lang',$code,$base); }
    $links['x-default'] = $links['en'];
    $images = array();
    foreach ($meta['media'] as $i=>$m) {
        $size = wp_get_attachment_metadata($m['id']);
        $images[] = array('@type'=>'ImageObject','contentUrl'=>$m['url'],'url'=>$m['url'],'width'=>isset($size['width'])?(int)$size['width']:1672,'height'=>isset($size['height'])?(int)$size['height']:941,'caption'=>$c['captions'][$i],'creditText'=>'Fourth Dimension Studio / OpenAI image generation','creator'=>array('@type'=>'Organization','name'=>'Fourth Dimension Studio'));
    }
    $article = array('@context'=>'https://schema.org','@type'=>'Article','headline'=>$c['title'],'description'=>$c['description'],'inLanguage'=>$lang,'mainEntityOfPage'=>array('@type'=>'WebPage','@id'=>$url),'url'=>$url,'datePublished'=>get_post_time('c',true,$id),'dateModified'=>get_post_modified_time('c',true,$id),'author'=>array('@type'=>'Organization','name'=>'Fourth Dimension Studio','url'=>home_url('/')),'publisher'=>array('@type'=>'Organization','name'=>'Fourth Dimension Studio','url'=>home_url('/')),'image'=>$images);
    $breadcrumb = array('@context'=>'https://schema.org','@type'=>'BreadcrumbList','itemListElement'=>array(array('@type'=>'ListItem','position'=>1,'name'=>$t[0],'item'=>$home),array('@type'=>'ListItem','position'=>2,'name'=>$t[1],'item'=>$archive),array('@type'=>'ListItem','position'=>3,'name'=>$c['title'],'item'=>$url)));
    $faq = array();
    if (preg_match('~<!--fd-faq-start-->(.*?)<!--fd-faq-end-->~s',$raw,$unused)) { /* Extract only the selected language below. */ }
    if (preg_match('~<!--fd-faq-start-->(.*?)<!--fd-faq-end-->~s',$match[1],$block)) {
        preg_match_all('~<h3[^>]*>(.*?)</h3>\s*<p>(.*?)</p>~s',$block[1],$pairs,PREG_SET_ORDER);
        foreach ($pairs as $pair) { $faq[] = array('@type'=>'Question','name'=>html_entity_decode(wp_strip_all_tags($pair[1]),ENT_QUOTES,'UTF-8'),'acceptedAnswer'=>array('@type'=>'Answer','text'=>html_entity_decode(wp_strip_all_tags($pair[2]),ENT_QUOTES,'UTF-8'))); }
    }
    $public = get_post_status($id)==='publish' && (string)get_option('blog_public')==='1';
    $robots = $public ? 'index,follow,max-image-preview:large' : 'noindex,nofollow,max-image-preview:large';
    $dir = $lang==='en' ? 'ltr' : 'rtl';
    $style = base64_decode('Kntib3gtc2l6aW5nOmJvcmRlci1ib3h9aHRtbHtzY3JvbGwtYmVoYXZpb3I6c21vb3RoO2JhY2tncm91bmQ6I2Y0ZjFlOTtjb2xvcjojMjUyZTJkfWJvZHl7bWFyZ2luOjA7Zm9udC1mYW1pbHk6VGFob21hLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjE4cHg7bGluZS1oZWlnaHQ6MS45fWJvZHk6bGFuZyhlbil7Zm9udC1mYW1pbHk6R2VvcmdpYSxzZXJpZn1tYWlue21heC13aWR0aDo4MjBweDttYXJnaW46YXV0bztwYWRkaW5nOjMwcHggMjZweCA4MHB4fWhlYWRlcnttYXgtd2lkdGg6MTEwMHB4O21hcmdpbjphdXRvO3BhZGRpbmc6MjBweCAyNnB4O2Rpc3BsYXk6ZmxleDtnYXA6MThweDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2M4YzliZX1oZWFkZXIgYXtjb2xvcjojMjY0ZTRkO3RleHQtZGVjb3JhdGlvbjpub25lfWhlYWRlciBuYXZ7ZGlzcGxheTpmbGV4O2dhcDoxOHB4fWgxe2ZvbnQtc2l6ZTpjbGFtcCgzMHB4LDQuNXZ3LDUycHgpO2xpbmUtaGVpZ2h0OjEuMzU7bGV0dGVyLXNwYWNpbmc6LS4wMmVtO21hcmdpbjozNXB4IDAgMjVweH1oMntmb250LXNpemU6MjhweDtsaW5lLWhlaWdodDoxLjU7bWFyZ2luOjJlbSAwIC43ZW07c2Nyb2xsLW1hcmdpbi10b3A6MjBweH1oM3tmb250LXNpemU6MjFweDtsaW5lLWhlaWdodDoxLjY7bWFyZ2luLXRvcDoxLjVlbX1we21hcmdpbjowIDAgMS4xZW19YXtjb2xvcjojMjc1OTUzO3RleHQtdW5kZXJsaW5lLW9mZnNldDo0cHg7b3ZlcmZsb3ctd3JhcDphbnl3aGVyZX1maWd1cmV7bWFyZ2luOjM1cHggLTYwcHh9cGljdHVyZSxpbWd7ZGlzcGxheTpibG9jazt3aWR0aDoxMDAlO2hlaWdodDphdXRvfWltZ3tib3JkZXItcmFkaXVzOjEycHh9ZmlnY2FwdGlvbntmb250OjE0cHgvMS44IFRhaG9tYSxBcmlhbCxzYW5zLXNlcmlmO21hcmdpbi10b3A6MTJweDtjb2xvcjojNDc1YzU4fXVsLG9se3BhZGRpbmctaW5saW5lLXN0YXJ0OjI1cHh9bGl7bWFyZ2luOi4zNWVtIDB9LnRvY3twYWRkaW5nOjIwcHggMjVweDtib3JkZXI6MXB4IHNvbGlkICNiOGM3YmU7Ym9yZGVyLXJhZGl1czoxMnB4O21hcmdpbjozNXB4IDB9LnRvYyBoMnttYXJnaW46MDtmb250LXNpemU6MjBweH0udG9jIG9se21hcmdpbi1ib3R0b206MH0uc3RhdHVze2ZvbnQ6MTRweC8xLjggVGFob21hLEFyaWFsLHNhbnMtc2VyaWY7Y29sb3I6IzU4NjM1Yn0ucmVsYXRlZHtib3JkZXItdG9wOjFweCBzb2xpZCAjYmJiO21hcmdpbi10b3A6MzBweDtwYWRkaW5nLXRvcDoxMHB4fUBtZWRpYShtYXgtd2lkdGg6NzYwcHgpe2JvZHl7Zm9udC1zaXplOjE3cHh9bWFpbntwYWRkaW5nOjE4cHggMjBweCA1MHB4fWhlYWRlcntmb250LXNpemU6MTNweDtmbGV4LXdyYXA6d3JhcH1maWd1cmV7bWFyZ2luOjI4cHggMH1oMntmb250LXNpemU6MjVweH19');
    $out = '<!doctype html><html lang="'.esc_attr($lang).'" dir="'.$dir.'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.esc_html($c['seo_title']).'</title><meta name="description" content="'.esc_attr($c['description']).'"><meta name="robots" content="'.esc_attr($robots).'"><link rel="canonical" href="'.esc_url($url).'">';
    foreach ($links as $code=>$href) { $out.='<link rel="alternate" hreflang="'.esc_attr($code).'" href="'.esc_url($href).'">'; }
    $out.='<meta property="og:type" content="article"><meta property="og:title" content="'.esc_attr($c['seo_title']).'"><meta property="og:description" content="'.esc_attr($c['description']).'"><meta property="og:url" content="'.esc_url($url).'"><meta property="og:site_name" content="Fourth Dimension Studio"><meta property="og:image" content="'.esc_url($meta['media'][0]['url']).'"><meta property="og:image:alt" content="'.esc_attr($c['alts'][0]).'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'.esc_attr($c['seo_title']).'"><meta name="twitter:description" content="'.esc_attr($c['description']).'"><meta name="twitter:image" content="'.esc_url($meta['media'][0]['url']).'">';
    foreach (array($article,$breadcrumb) as $schema) { $out.='<script type="application/ld+json">'.wp_json_encode($schema,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_HEX_TAG).'</script>'; }
    if (count($faq)>=4) { $out.='<script type="application/ld+json">'.wp_json_encode(array('@context'=>'https://schema.org','@type'=>'FAQPage','inLanguage'=>$lang,'mainEntity'=>$faq),JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_HEX_TAG).'</script>'; }
    $out.='<style>'.$style.'</style></head><body><header><a href="'.esc_url($home).'">FOURTH DIMENSION STUDIO</a><nav aria-label="Language">';
    foreach (array('en'=>'English','fa'=>'فارسی','ar'=>'العربية') as $code=>$name) { $out.='<a href="'.esc_url($links[$code]).'" lang="'.$code.'" hreflang="'.$code.'"'.($code===$lang?' aria-current="page"':'').'>'.esc_html($name).'</a>'; }
    $out.='</nav></header><main><nav aria-label="Breadcrumb"><a href="'.esc_url($home).'">'.esc_html($t[0]).'</a> / <a href="'.esc_url($archive).'">'.esc_html($t[1]).'</a></nav><article>'.$body.'</article><footer><a href="'.esc_url(add_query_arg(array('page'=>'about','lang'=>$lang),home_url('/wp-content/themes/fourth-dimension-theme/site/legal/privacy.html'))).'">'.esc_html($t[4]).'</a></footer></main></body></html>';
    return $out;
}

/* Keep the normal WP template lifecycle. Replace its buffered HTML only for this marked article. */
add_filter('template_include', static function($template) {
    if (!is_singular('post')) { return $template; }
    $id = get_queried_object_id();
    if (get_post_meta($id,'_fd_ai_article_key_20261020',true)!=='ARTICLE-20261020-AI-IMAGE-TO-BUILDABLE') { return $template; }
    if (post_password_required($id)) { return $template; }
    ob_start(static function($discarded) use ($id) { $html=fd_ai_article_html_20261020($id);return $html!==''?$html:$discarded; });
    return $template;
}, 9999);

