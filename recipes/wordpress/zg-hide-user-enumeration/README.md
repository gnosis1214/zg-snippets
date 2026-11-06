# zg-hide-user-enumeration

## What it does

Stops anonymous visitors from collecting WordPress usernames, which attackers use for password guessing. It closes four routes:

| Route | Before | After |
|---|---|---|
| `/?author=1` and `/?author_name=x` | Redirects to `/author/<username>/` or shows the archive | 404 |
| `/wp-json/wp/v2/users` | Lists users | 401 |
| `/wp-sitemap-users-1.xml` | Lists author URLs | Removed |
| oEmbed responses | Include author name and URL | Author details removed |

Logged-in users are not affected, so the block editor's author picker and application passwords keep working.

## Where it goes

Copy `zg-hide-user-enumeration.php` to `wp-content/mu-plugins/`. Create that folder if it doesn't exist. WordPress loads the file automatically, with no activation step.

## How to use

1. Add the file on staging.
2. While logged out, open `/?author=1` and `/wp-json/wp/v2/users`. You should get a 404 and a 401.
3. While logged in, open a post in the block editor and check that the author picker still lists users.

**What it doesn't hide:** `/author/<username>/` archives still work, because some sites use them as public profile pages. Themes that print author links also still show the username, so give users a display name and a nicename that differ from their login if that matters.

**Check first:** anything that reads `/wp/v2/users` without logging in, such as a headless front end, will start getting a 401.

## Tested

- Unit tests with stubbed WordPress functions (`zg-hide-user-enumeration.test.php`), including `/WP/V2/USERS` and `?author[]=1`.
- PHP 8.3 lint.
- **Not yet run on a real WordPress install.** Try it on staging first.
