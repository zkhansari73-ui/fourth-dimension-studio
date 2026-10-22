<?php
// FD TEMP: register the two uploaded hero files as WP attachments (one-shot)
add_action('admin_init', function () {
    if (!current_user_can('manage_options') || get_option('fd_hero_att_done')) return;
    $base = '/home/vol7_8/infinityfree.com/if0_42900078/htdocs/wp-content/uploads/2026/10/';
    $urlbase = 'https://fourth-dimension-studio.infinityfreeapp.com/wp-content/uploads/2026/10/';
    $files = array('hero-facade-ai.jpg', 'hero-biophilic.jpg');
    $out = array();
    require_once ABSPATH . 'wp-admin/includes/image.php';
    global $wpdb;
    foreach ($files as $f) {
        $path = $base . $f;
        if (!file_exists($path)) { $out[] = $f . ': MISSING'; continue; }
        $existing = $wpdb->get_var($wpdb->prepare("SELECT ID FROM $wpdb->posts WHERE guid = %s AND post_type = 'attachment'", $urlbase . $f));
        if ($existing) { $out[] = $f . ': EXISTS id=' . $existing; continue; }
        $id = wp_insert_attachment(array(
            'guid' => $urlbase . $f,
            'post_mime_type' => 'image/jpeg',
            'post_title' => pathinfo($f, PATHINFO_FILENAME),
            'post_content' => '',
            'post_status' => 'inherit',
        ), $path);
        if ($id && !is_wp_error($id)) {
            $meta = wp_generate_attachment_metadata($id, $path);
            wp_update_attachment_metadata($id, $meta);
            $out[] = $f . ': NEW id=' . $id;
        } else {
            $out[] = $f . ': INSERT FAILED';
        }
    }
    update_option('fd_hero_att_report', implode(' | ', $out));
    update_option('fd_hero_att_done', 1);
});
add_action('admin_notices', function () {
    $v = get_option('fd_hero_att_report');
    if ($v) echo '<div class="notice notice-success"><p>FD HERO ATT REPORT: ' . esc_html($v) . '</p></div>';
});
