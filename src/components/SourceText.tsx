import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { loadAuthorIds } from "../engine/content";
import { splitSource } from "../engine/bibliography";
import type { Lang } from "../schema/scenario.schema";

function useAuthorIds(lang: Lang): Map<string, string> {
  const [ids, setIds] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let live = true;
    loadAuthorIds(lang)
      .then((map) => live && setIds(map))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lang]);

  return ids;
}

export default function SourceText({ source, lang }: { source: string; lang: Lang }) {
  const ids = useAuthorIds(lang);
  const refs = useMemo(() => splitSource(source), [source]);

  return refs.map((ref, i) => {
    const head = ref.split(",")[0];
    return (
      <Fragment key={i}>
        {i > 0 && "; "}
        {head.split(/(\s+&\s+)/).map((part, j) => {
          const id = ids.get(part);
          return id ? (
            <Link
              key={j}
              to={`/autori#${id}`}
              className="font-bold underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
            >
              {part}
            </Link>
          ) : (
            part
          );
        })}
        {ref.slice(head.length)}
      </Fragment>
    );
  });
}
