<?php
/**
 * Plugin Name: ClientFlow - Lead & Appointment Booking
 * Plugin URI: https://clientflow.app
 * Description: Embed ClientFlow booking forms and lead capture widgets into your WordPress website via shortcode or Gutenberg block.
 * Version: 1.0.0
 * Author: ClientFlow
 * Author URI: https://clientflow.app
 * License: GPL2
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CLIENTFLOW_VERSION', '1.0.0');
define('CLIENTFLOW_DEFAULT_DOMAIN', 'https://app.clientflow.com');

// Register Settings
function clientflow_register_settings() {
    register_setting('clientflow_settings_group', 'clientflow_app_domain');
}
add_action('admin_init', 'clientflow_register_settings');

// Add Settings Menu
function clientflow_admin_menu() {
    add_options_page(
        'ClientFlow Settings',
        'ClientFlow Booking',
        'manage_options',
        'clientflow-settings',
        'clientflow_settings_page'
    );
}
add_action('admin_menu', 'clientflow_admin_menu');

function clientflow_settings_page() {
    ?>
    <div class="wrap">
        <h2>ClientFlow Booking Configuration</h2>
        <form method="post" action="options.php">
            <?php settings_fields('clientflow_settings_group'); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Platform Domain</th>
                    <td>
                        <input type="text" name="clientflow_app_domain" value="<?php echo esc_attr(get_option('clientflow_app_domain', CLIENTFLOW_DEFAULT_DOMAIN)); ?>" class="regular-text" />
                        <p class="description">Your ClientFlow platform URL (e.g., https://app.clientflow.com or your custom domain).</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <hr/>
        <h3>How to use:</h3>
        <p>Use the shortcode anywhere in your pages or posts:</p>
        <code>[clientflow_form id="YOUR_FORM_ID"]</code>
        <p>Or legacy format:</p>
        <code>[platform_form id="YOUR_FORM_ID"]</code>
    </div>
    <?php
}

// Shortcode Handler
function clientflow_shortcode_handler($atts) {
    $a = shortcode_atts(array(
        'id' => '',
        'height' => '650px',
    ), $atts);

    if (empty($a['id'])) {
        return '<p style="color:red;">[ClientFlow] Please specify a form id: [clientflow_form id="abc123"]</p>';
    }

    $domain = rtrim(get_option('clientflow_app_domain', CLIENTFLOW_DEFAULT_DOMAIN), '/');
    $form_id = esc_attr($a['id']);
    $height = esc_attr($a['height']);

    $output = '<div class="clientflow-form-embed" id="cf-form-' . $form_id . '">';
    $output .= '<iframe src="' . esc_url($domain . '/f/' . $form_id . '?embed=true') . '" ';
    $output .= 'style="width:100%; min-height:' . $height . '; border:none; overflow:hidden;" loading="lazy"></iframe>';
    $output .= '</div>';

    return $output;
}
add_shortcode('clientflow_form', 'clientflow_shortcode_handler');
add_shortcode('platform_form', 'clientflow_shortcode_handler');
