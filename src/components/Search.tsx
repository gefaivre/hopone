import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { searchParamsFromUrl, searchParamsToUrl, searchQueryOptions, type SearchParams } from '@publisher/client';
import { useDeferredValue, useEffect, useState } from 'react';

// The search of the site (Publisher docs/search.md): TanStack Query in the browser, results from Publisher.

const publisher = { url: import.meta.env.PUBLIC_PUBLISHER_URL, site: import.meta.env.PUBLIC_PUBLISHER_SITE };
const queryClient = new QueryClient();

type Labels = Record<'placeholder' | 'noResults' | 'all' | 'news' | 'evergreen' | 'tool' | 'results' | 'minRead', string>;

function Results({ locale, labels }: { locale: string; labels: Labels }) {
  const [params, setParams] = useState<SearchParams>(() => searchParamsFromUrl(location.href, locale));
  // While typing, the query follows the text without blocking the field.
  const deferred = useDeferredValue(params);
  const { data, isPending, isError } = useQuery(searchQueryOptions(publisher, deferred));

  useEffect(() => history.replaceState(null, '', searchParamsToUrl(location.href, params)), [params]);

  // Tools only show up once the site has some.
  const types = (['all', 'news', 'evergreen', 'tool'] as const).filter((type) => type !== 'tool' || (data?.facets.types.tool ?? 0) > 0);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso));

  return (
    <div className="search">
      <input
        className="search__input"
        type="search"
        autoFocus
        aria-label={labels.placeholder}
        value={params.q ?? ''}
        placeholder={labels.placeholder}
        onChange={(e) => setParams({ ...params, q: e.target.value, page: 1 })}
      />
      <div className="search__chips">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            className="search__chip"
            aria-pressed={(params.type ?? 'all') === type}
            onClick={() => setParams({ ...params, type, page: 1 })}
          >
            {labels[type]} <small>{data?.facets.types[type] ?? ''}</small>
          </button>
        ))}
      </div>
      <div className="search__chips">
        {data?.facets.categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className="search__chip"
            aria-pressed={params.category === c.key}
            onClick={() => setParams({ ...params, category: params.category === c.key ? undefined : c.key, page: 1 })}
          >
            {c.name} <small>{c.count}</small>
          </button>
        ))}
      </div>
      {isError ? (
        <p className="listing__empty">…</p>
      ) : isPending ? (
        <p className="listing__empty">…</p>
      ) : data.results.length === 0 ? (
        <p className="listing__empty">{labels.noResults}</p>
      ) : (
        <>
          <p className="pagination__status">
            {data.total} {labels.results}
          </p>
          <ul className="search__results">
            {data.results.map((r) => (
              <li key={r.url}>
                <p className="card__kicker">{r.category.name}</p>
                <h2 className="card__title">
                  <a href={r.url}>{r.title}</a>
                </h2>
                <p className="card__excerpt">{r.description}</p>
                <p className="card__meta">
                  <time dateTime={r.publishedAt}>{date(r.publishedAt)}</time>
                  {r.readingMinutes !== null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {r.readingMinutes} {labels.minRead}
                      </span>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {data.pageCount > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {data.page > 1 ? (
                <button type="button" onClick={() => setParams({ ...params, page: data.page - 1 })}>
                  ←
                </button>
              ) : (
                <span />
              )}
              <span className="pagination__status">
                {data.page} / {data.pageCount}
              </span>
              {data.page < data.pageCount ? (
                <button type="button" onClick={() => setParams({ ...params, page: data.page + 1 })}>
                  →
                </button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default function Search(props: { locale: string; labels: Labels }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Results {...props} />
    </QueryClientProvider>
  );
}
