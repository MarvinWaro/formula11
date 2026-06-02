<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Allowlist-based HTML sanitizer for rich-text fields posted by trusted
 * admins. Drops disallowed tags, attributes, and unsafe URL schemes.
 */
class HtmlSanitizer
{
    /** @var array<int, string> */
    private const ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 's',
        'h2', 'h3', 'ul', 'ol', 'li',
        'blockquote', 'a', 'code', 'pre',
    ];

    /** @var array<int, string> */
    private const ALLOWED_ATTRS = ['href', 'rel', 'target'];

    /** @var array<int, string> */
    private const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];

    public static function clean(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $trimmed = trim($html);
        if ($trimmed === '' || $trimmed === '<p></p>') {
            return null;
        }

        $doc = new DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $doc->loadHTML(
            '<?xml encoding="utf-8"?><div>'.$trimmed.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();

        $root = $doc->getElementsByTagName('div')->item(0);
        if (! $root instanceof DOMElement) {
            return null;
        }

        self::walk($root);

        $out = '';
        foreach ($root->childNodes as $child) {
            $out .= $doc->saveHTML($child);
        }

        return trim($out) === '' ? null : $out;
    }

    /** Block elements that should be dropped entirely if empty. */
    private const PRUNE_IF_EMPTY = ['p', 'h2', 'h3', 'li', 'blockquote'];

    private static function walk(DOMNode $node): void
    {
        // Iterate over a snapshot since the live list mutates during removal.
        $children = [];
        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }

        foreach ($children as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);

            if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                // Replace the disallowed wrapper with its children so users
                // don't lose text content.
                while ($child->firstChild) {
                    $child->parentNode?->insertBefore($child->firstChild, $child);
                }
                $child->parentNode?->removeChild($child);

                continue;
            }

            self::stripAttributes($child, $tag);
            self::walk($child);

            if (
                in_array($tag, self::PRUNE_IF_EMPTY, true)
                && trim($child->textContent) === ''
                && ! self::containsAnyTag($child, ['br', 'img'])
            ) {
                $child->parentNode?->removeChild($child);
            }
        }
    }

    /**
     * @param  array<int, string>  $tags
     */
    private static function containsAnyTag(DOMElement $el, array $tags): bool
    {
        foreach ($tags as $tag) {
            if ($el->getElementsByTagName($tag)->length > 0) {
                return true;
            }
        }

        return false;
    }

    private static function stripAttributes(DOMElement $el, string $tag): void
    {
        $names = [];
        foreach ($el->attributes as $attr) {
            $names[] = $attr->name;
        }

        foreach ($names as $name) {
            $lower = strtolower($name);

            if (! in_array($lower, self::ALLOWED_ATTRS, true)) {
                $el->removeAttribute($name);

                continue;
            }

            if ($lower === 'href') {
                $href = trim($el->getAttribute('href'));
                if (! self::isSafeUrl($href)) {
                    $el->removeAttribute('href');
                }
            }
        }

        // Force safe defaults on links.
        if ($tag === 'a' && $el->hasAttribute('href')) {
            $el->setAttribute('rel', 'noopener noreferrer');
            $el->setAttribute('target', '_blank');
        }
    }

    private static function isSafeUrl(string $url): bool
    {
        if ($url === '') {
            return false;
        }

        // Relative URLs (#anchor, /path) are fine.
        if ($url[0] === '#' || $url[0] === '/') {
            return true;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        return in_array($scheme, self::SAFE_SCHEMES, true);
    }
}
