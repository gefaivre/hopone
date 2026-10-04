<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>Hopone — XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #0b0b0c;
            background: #faf8f5;
            margin: 0;
            padding: 2.5rem 1.5rem;
          }
          .container {
            max-width: 980px;
            margin: 0 auto;
          }
          header {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 2px solid #0b0b0c;
          }
          h1 {
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin: 0 0 0.5rem 0;
          }
          p.lead {
            color: #5a5751;
            font-size: 1rem;
            margin: 0 0 1rem 0;
          }
          .badge {
            display: inline-block;
            background: #d7ff3a;
            color: #0b0b0c;
            font-weight: 700;
            font-size: 0.85rem;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            border: 1px solid #0b0b0c;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border: 1px solid #e5e0d8;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          }
          th {
            background: #0b0b0c;
            color: #faf8f5;
            text-align: left;
            padding: 0.85rem 1rem;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
          }
          tr:hover td {
            background-color: #f7f5f0;
          }
          a {
            color: #0b0b0c;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .meta {
            color: #7a756c;
            font-family: monospace;
            font-size: 0.85rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>Hopone XML Sitemap</h1>
            <p class="lead">Index of public pages generated for search engines and crawlers.</p>
            <span class="badge"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</span>
          </header>
          <table>
            <thead>
              <tr>
                <th style="width: 55%;">URL</th>
                <th style="width: 15%;">Priority</th>
                <th style="width: 15%;">Change Frequency</th>
                <th style="width: 15%;">Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td class="meta"><xsl:value-of select="sitemap:priority"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:changefreq"/></td>
                  <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
