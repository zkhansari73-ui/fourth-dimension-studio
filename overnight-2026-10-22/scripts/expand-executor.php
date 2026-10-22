<?php
/*
Plugin Name: FD Expansion Installer v2 (TEMP)
Description: TEMP one-shot: auto-discovers staging drafts by their FD-EXP markers, inserts each expansion block into its target article language part (backup first, idempotent), reports per post/lang. Delete after use.
*/
add_action('admin_init', function () {
    if (!current_user_can('manage_options') || get_option('fd_expand_done')) return;
    // Targets: post ID => languages to expand
    $targets = array(
        195 => array('fa', 'en', 'ar'),
        181 => array('en', 'ar'),
        173 => array('ar'),
        94  => array('fa', 'en', 'ar'),
        92  => array('fa', 'en', 'ar'),
        15  => array('fa', 'en', 'ar'),
        16  => array('fa', 'en', 'ar'),
        19  => array('fa', 'en', 'ar'),
    );
    // Auto-discover staging drafts (any post whose content carries an FD-EXP marker)
    $q = new WP_Query(array('post_type' => 'post', 'post_status' => array('draft', 'pending', 'private'), 's' => 'FD STAGE', 'posts_per_page' => 100));
    $blocks = array(); // "target:lang" => longest block found
    $foundIn = array();
    foreach ($q->posts as $sp) {
        $sc = (string) $sp->post_content;
        $sc = preg_replace('/<!-- \/?wp:[^>]*-->/', '', $sc);
        if (preg_match_all('/<!--FD-EXP:(\d+):([a-z]+)-->(.*?)(?=<!--FD-EXP:|\z)/s', $sc, $mm, PREG_SET_ORDER)) {
            foreach ($mm as $one) {
                $key = $one[1] . ':' . $one[2];
                $blk = trim($one[3]);
                if (!isset($blocks[$key]) || mb_strlen($blk) > mb_strlen($blocks[$key])) { $blocks[$key] = $blk; $foundIn[$key] = $sp->ID; }
            }
        }
    }
    $report = array();
    $report[] = 'DISCOVERED BLOCKS: ' . count($blocks);
    foreach ($targets as $targetId => $langs) {
        $target = get_post($targetId);
        if (!$target) { $report[] = $targetId . ': MISSING TARGET'; continue; }
        $c = (string) $target->post_content;
        if (!get_option('fd_pre_expand_' . $targetId)) update_option('fd_pre_expand_' . $targetId, $c);
        $changed = false;
        foreach ($langs as $lang) {
            $key = $targetId . ':' . $lang;
            if (!isset($blocks[$key])) { $report[] = $targetId . '/' . $lang . ': NO STAGING BLOCK FOUND'; continue; }
            $block = $blocks[$key];
            if ($block === '') { $report[] = $targetId . '/' . $lang . ': EMPTY BLOCK'; continue; }
            if (strpos($block, '&lt;') !== false && strpos($block, '<h2') === false) { $report[] = $targetId . '/' . $lang . ': ESCAPED TEXT IN STAGING - REDO DRAFT'; continue; }
            if (!preg_match('/<h2[^>]*>(.*?)<\/h2>/s', $block, $hm)) { $report[] = $targetId . '/' . $lang . ': BLOCK HAS NO H2'; continue; }
            $h2text = trim(strip_tags($hm[1]));
            if (strpos($c, $h2text) !== false) { $report[] = $targetId . '/' . $lang . ': ALREADY INSTALLED (skip)'; continue; }
            $part = null; $m = array();
            if (preg_match('/(<!--fd-locale-start:' . $lang . '-->)(.*?)(<!--fd-locale-end:' . $lang . '-->)/s', $c, $m)) $part = $m[2];
            elseif (preg_match('/(<section[^>]*lang="' . $lang . '"[^>]*>)(.*?)(<\/section>)/s', $c, $m)) $part = $m[2];
            if ($part === null) { $report[] = $targetId . '/' . $lang . ': LANG PART NOT FOUND'; continue; }
            $anchor = null; $apos = null;
            if (preg_match('/<h2[^>]*>[^<]*(پرسش‌های|Frequently asked|أسئلة شائعة)[^<]*<\/h2>/u', $part, $am, PREG_OFFSET_CAPTURE)) { $anchor = 'faq'; $apos = $am[0][1]; }
            elseif (preg_match('/<h2[^>]*>[^<]*(درباره|About the|عن ال|About our)[^<]*<\/h2>/u', $part, $am, PREG_OFFSET_CAPTURE)) { $anchor = 'bio'; $apos = $am[0][1]; }
            if ($apos === null) { $newpart = $part . "\n" . $block . "\n"; $anchor = 'end'; }
            else $newpart = substr($part, 0, $apos) . $block . "\n" . substr($part, $apos);
            $c = str_replace($m[0], $m[1] . $newpart . $m[3], $c);
            $changed = true;
            $report[] = $targetId . '/' . $lang . ': INSERTED before ' . $anchor . ' (+' . mb_strlen($block) . ' chars, from draft ' . $foundIn[$key] . ')';
        }
        if ($changed) {
            wp_update_post(array('ID' => $targetId, 'post_content' => $c));
            $report[] = $targetId . ': SAVED new chars=' . mb_strlen($c);
        } else {
            $report[] = $targetId . ': NO CHANGE';
        }
    }
    update_option('fd_expand_report', implode("\n", $report));
    update_option('fd_expand_done', 1);
});
add_action('admin_notices', function () {
    $v = get_option('fd_expand_report');
    if ($v) echo '<div class="notice notice-success"><p>FD EXPAND REPORT:<br>' . nl2br(esc_html($v)) . '</p></div>';
});
