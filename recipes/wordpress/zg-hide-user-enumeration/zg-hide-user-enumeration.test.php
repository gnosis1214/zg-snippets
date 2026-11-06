<?php
// Unit tests with stubbed WordPress functions. Run: php zg-hide-user-enumeration.test.php

define( 'ABSPATH', __DIR__ );

$GLOBALS['zg_logged_in'] = false;
$GLOBALS['zg_calls']     = array();
$GLOBALS['zg_hooks']     = array();

function add_action( $hook, $callback, $priority = 10 ) {
	$GLOBALS['zg_hooks'][ $hook ] = array( $callback, $priority );
}
function add_filter( $hook, $callback, $priority = 10 ) {
	add_action( $hook, $callback, $priority );
}
function is_user_logged_in() {
	return $GLOBALS['zg_logged_in'];
}
function status_header( $code ) {
	$GLOBALS['zg_calls'][] = "status:$code";
}
function nocache_headers() {
	$GLOBALS['zg_calls'][] = 'nocache';
}
function remove_action( $hook, $callback ) {
	$GLOBALS['zg_calls'][] = "remove:$hook:$callback";
}
function __( $text ) {
	return $text;
}
function rest_authorization_required_code() {
	return 401;
}

class WP_Error {
	public $code;
	public $data;
	public function __construct( $code, $message, $data ) {
		$this->code = $code;
		$this->data = $data;
	}
}

class ZG_Query {
	public $is_404 = false;
	public function set_404() {
		$this->is_404 = true;
	}
}

class ZG_Request {
	private $route;
	public function __construct( $route ) {
		$this->route = $route;
	}
	public function get_route() {
		return $this->route;
	}
}

require __DIR__ . '/zg-hide-user-enumeration.php';

$failures = 0;
function zg_assert( $name, $condition ) {
	global $failures;
	echo ( $condition ? 'ok   ' : 'FAIL ' ) . $name . PHP_EOL;
	$failures += $condition ? 0 : 1;
}

function zg_reset( $get = array(), $logged_in = false ) {
	global $wp_query;
	$wp_query                = new ZG_Query();
	$_GET                    = $get;
	$GLOBALS['zg_logged_in'] = $logged_in;
	$GLOBALS['zg_calls']     = array();
}

// The block has to run before redirect_canonical at priority 10.
zg_assert( 'author block runs before canonical redirect', $GLOBALS['zg_hooks']['template_redirect'][1] < 10 );

zg_reset( array( 'author' => '1' ) );
zg_block_author_query();
zg_assert( '?author=1 gives a 404', $wp_query->is_404 && in_array( 'status:404', $GLOBALS['zg_calls'], true ) );
zg_assert( '?author=1 cancels the canonical redirect', in_array( 'remove:template_redirect:redirect_canonical', $GLOBALS['zg_calls'], true ) );

zg_reset( array( 'author' => array( '1' ) ) );
zg_block_author_query();
zg_assert( '?author[]=1 gives a 404', $wp_query->is_404 );

zg_reset( array( 'author_name' => 'admin' ) );
zg_block_author_query();
zg_assert( '?author_name=admin gives a 404', $wp_query->is_404 );

zg_reset( array( 'author' => '1' ), true );
zg_block_author_query();
zg_assert( 'logged-in users keep ?author=1', ! $wp_query->is_404 );

zg_reset( array( 's' => 'hello' ) );
zg_block_author_query();
zg_assert( 'other URLs are untouched', ! $wp_query->is_404 && array() === $GLOBALS['zg_calls'] );

$blocked = array( '/wp/v2/users', '/wp/v2/users/', '/wp/v2/users/1', '/WP/V2/USERS', '/wp/v2/Users/1' );
foreach ( $blocked as $route ) {
	zg_reset();
	$result = zg_block_rest_users( null, null, new ZG_Request( $route ) );
	zg_assert( "$route is blocked with a 401", $result instanceof WP_Error && 401 === $result->data['status'] );
}

$allowed = array( '/wp/v2/posts', '/wp/v2/users-extra', '/custom/v1/wp/v2/users' );
foreach ( $allowed as $route ) {
	zg_reset();
	zg_assert( "$route is allowed", null === zg_block_rest_users( null, null, new ZG_Request( $route ) ) );
}

zg_reset( array(), true );
zg_assert( 'logged-in users keep the users route', null === zg_block_rest_users( null, null, new ZG_Request( '/wp/v2/users' ) ) );

zg_reset();
zg_assert( 'an earlier filter result is kept', 'earlier' === zg_block_rest_users( 'earlier', null, new ZG_Request( '/wp/v2/users' ) ) );

zg_assert( 'users sitemap is removed', false === zg_remove_users_sitemap( 'provider', 'users' ) );
zg_assert( 'posts sitemap is kept', 'provider' === zg_remove_users_sitemap( 'provider', 'posts' ) );

$oembed = zg_strip_oembed_author(
	array(
		'title'       => 'Post',
		'author_name' => 'admin',
		'author_url'  => 'https://example.com/author/admin/',
	)
);
zg_assert( 'oEmbed author details are removed', array( 'title' => 'Post' ) === $oembed );

exit( $failures > 0 ? 1 : 0 );
