<?php
/*
Plugin Name: FD Wordcount Probe (TEMP)
Description: TEMP read-only: per-language word counts for the 8 articles. Delete after use.
*/
add_action('admin_notices', function () {
    $ids = array(195, 181, 173, 94, 92, 15, 16, 19);
    $out = array();
    foreach ($ids as $id) {
        $p = get_post($id);
        if (!$p) { $out[] = $id . ': MISSING'; continue; }
        $c = (string) $p->post_content;
        foreach (array('fa', 'en', 'ar') as $lang) {
            $part = null;
            if (preg_match('/<!--fd-locale-start:' . $lang . '-->(.*?)<!--fd-locale-end:' . $lang . '-->/s', $c, $m)) $part = $m[1];
            elseif (preg_match('/<section[^>]*lang="' . $lang . '"[^>]*>(.*?)<\/section>/s', $c, $m)) $part = $m[1];
            if ($part === null) { $out[] = $id . ' ' . $lang . ' = NOPART'; continue; }
            $text = wp_strip_all_tags($part);
            $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
            $n = preg_match_all('/\S+/u', $text);
            $out[] = $id . ' ' . $lang . ' = ' . $n;
        }
    }
    echo '<div class="notice notice-info"><p>FD WORDCOUNT:<br>' . implode('<br>', array_map('esc_html', $out)) . '</p></div>';
});
