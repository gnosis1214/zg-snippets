<?php
/**
 * Plugin Name: ZG Hide User Enumeration
 * Description: Stops anonymous visitors from listing usernames through ?author=N, the REST API, the users sitemap and oEmbed.
 * Version: 1.0.0
 * Author: Zeno
 * Author URI: https://zana-g.com
 * License: MIT
 */

defined( 'ABSPATH' ) || exit;

/**
 * Returns a 404 for ?author=N and ?author_name=x, before WordPress redirects
 * them to /author/<username>/ and reveals the username.
 */
function zg_block_author_query() {
	if ( is_user_logged_in() ) {
		return;
	}

	if ( ! isset( $_GET['author'] ) && ! isset( $_GET['author_name'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	global $wp_query;
	$wp_query->set_404();
	status_header( 404 );
	nocache_headers();
	remove_action( 'template_redirect', 'redirect_canonical' );
}
add_action( 'template_redirect', 'zg_block_author_query', 1 );

/**
 * Blocks anonymous requests to the REST users routes. This runs after REST
 * authentication, so the block editor and application passwords keep working.
 *
 * The match ignores case because WordPress matches REST routes without regard
 * to case: /WP/V2/users reaches the same endpoint as /wp/v2/users.
 *
 * @param mixed           $result  Response to use instead, or null.
 * @param WP_REST_Server  $server  Server instance.
 * @param WP_REST_Request $request Current request.
 * @return mixed
 */
function zg_block_rest_users( $result, $server, $request ) {
	if ( null !== $result || is_user_logged_in() ) {
		return $result;
	}

	if ( ! preg_match( '#^/wp/v2/users(?:/|$)#i', $request->get_route() ) ) {
		return $result;
	}

	return new WP_Error(
		'rest_forbidden',
		__( 'Sorry, you are not allowed to do that.' ),
		array( 'status' => rest_authorization_required_code() )
	);
}
add_filter( 'rest_pre_dispatch', 'zg_block_rest_users', 10, 3 );

/**
 * Removes the users sitemap, which lists an author URL for each user.
 *
 * @param WP_Sitemaps_Provider $provider Sitemap provider.
 * @param string               $name     Provider name.
 * @return WP_Sitemaps_Provider|false
 */
function zg_remove_users_sitemap( $provider, $name ) {
	return 'users' === $name ? false : $provider;
}
add_filter( 'wp_sitemaps_add_provider', 'zg_remove_users_sitemap', 10, 2 );

/**
 * Removes author details from oEmbed responses.
 *
 * @param array $data oEmbed response data.
 * @return array
 */
function zg_strip_oembed_author( $data ) {
	unset( $data['author_name'], $data['author_url'] );
	return $data;
}
add_filter( 'oembed_response_data', 'zg_strip_oembed_author' );
