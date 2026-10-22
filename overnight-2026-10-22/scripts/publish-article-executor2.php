<?php
/*
Plugin Name: FD Publish Article v2 (TEMP)
Description: TEMP one-shot: publishes ONE new article by joining two staged halves per language (config: parts = lang => [draftId1, draftId2]), replaces HERO_URL and per-language [[DATE]], sets category 9, featured image + its alt from the fa figure, excerpt from the fa dek. CONFIG filled before activation. Delete after use.
*/
add_action('admin_init', function () {
    if (!current_user_can('manage_options') || get_option('fd_pub2_done_X')) return;
    $cfg = /*FD_PUB2_CONFIG*/ array();
    $parts = $cfg['parts'];
    $langs = array('fa', 'en', 'ar');
    $content = '';
    foreach ($langs as $lang) {
        $joined = '';
        foreach ($parts[$lang] as $pid) {
            $p = get_post($pid);
            if (!$p) { update_option('fd_pub2_report_X', 'PART NOT FOUND lang=' . $lang . ' id=' . $pid); update_option('fd_pub2_done_X', 1); return; }
            $joined .= (string) $p->post_content;
        }
        $content .= $joined;
    }
    $content = str_replace('HERO_URL', $cfg['heroUrl'], $content);
    $dates = array('fa' => '۳۰ مهر ۱۴۰۵', 'en' => 'October 22, 2026', 'ar' => '٢٢ أكتوبر ٢٠٢٦');
    $content = preg_replace_callback('/(<section[^>]*lang="(fa|en|ar)"[^>]*>)(.*?)(<\/section>)/s', function ($m) use ($dates) {
        return $m[1] . str_replace('[[DATE]]', $dates[$m[2]], $m[3]) . $m[4];
    }, $content);
    $title = '';
    $excerpt = '';
    $sm = null;
    if (preg_match('/<section[^>]*lang="fa"[^>]*>(.*?)<\/section>/s', $content, $sm)) {
        if (preg_match('/<h1[^>]*>(.*?)<\/h1>/s', $sm[1], $hm)) $title = trim(strip_tags($hm[1]));
        if (preg_match('/<\/h1>\s*<p>(.*?)<\/p>/s', $sm[1], $dm)) $excerpt = trim(strip_tags($dm[1]));
    }
    if ($title === '') { update_option('fd_pub2_report_X', 'TITLE NOT FOUND'); update_option('fd_pub2_done_X', 1); return; }
    $newId = wp_insert_post(array(
        'post_title' => $title,
        'post_name' => $cfg['slug'],
        'post_content' => $content,
        'post_status' => 'publish',
        'post_category' => array(9),
        'post_excerpt' => $excerpt,
    ));
    if ($newId && !is_wp_error($newId)) {
        set_post_thumbnail($newId, $cfg['hero']);
        if (preg_match('/<section[^>]*lang="fa"[^>]*>(.*?)<\/section>/s', $content, $fsm) && preg_match('/<img[^>]*alt="([^"]*)"/', $fsm[1], $am)) {
            update_post_meta($cfg['hero'], '_wp_attachment_image_alt', $am[1]);
        }
        update_option('fd_pub2_report_X', 'PUBLISHED id=' . $newId . ' title=' . $title . ' url=' . get_permalink($newId));
    } else {
        update_option('fd_pub2_report_X', 'INSERT FAILED');
    }
    update_option('fd_pub2_done_X', 1);
});
add_action('admin_notices', function () {
    $v = get_option('fd_pub2_report_X');
    if ($v) echo '<div class="notice notice-success"><p>FD PUB2 REPORT: ' . esc_html($v) . '</p></div>';
});
