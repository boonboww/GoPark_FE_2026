"use client";

import React from "react";

type MessageSegment =
  | { type: "text"; lines: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdownTableLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(line: string) {
  const cells = parseMarkdownTableLine(line);
  return Boolean(cells?.length && cells.every((cell) => /^:?-{3,}:?$/.test(cell)));
}

function parseMessageContent(content: string): MessageSegment[] {
  const lines = content.split("\n");
  const segments: MessageSegment[] = [];
  let index = 0;

  while (index < lines.length) {
    const tableHeader = parseMarkdownTableLine(lines[index]);
    if (tableHeader && isDividerRow(lines[index + 1] || "")) {
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length) {
        const row = parseMarkdownTableLine(lines[index]);
        if (!row) break;
        rows.push(row);
        index += 1;
      }
      segments.push({ type: "table", headers: tableHeader, rows });
      continue;
    }

    const textLines: string[] = [];
    while (index < lines.length) {
      if (parseMarkdownTableLine(lines[index]) && isDividerRow(lines[index + 1] || "")) break;
      textLines.push(lines[index]);
      index += 1;
    }
    if (textLines.some((line) => line.trim())) {
      segments.push({ type: "text", lines: textLines });
    }
  }

  return segments;
}

function renderInlineText(text: string) {
  return text
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`(.*?)`/g, "$1");
}

export function ChatMessageContent({ content }: { content: string }) {
  return (
    <div className="chat-md">
      {parseMessageContent(content).map((segment, segmentIndex) => {
        if (segment.type === "table") {
          return (
            <div className="chat-md-table-wrap" key={`table-${segmentIndex}`}>
              <table className="chat-md-table">
                <thead>
                  <tr>
                    {segment.headers.map((header, headerIndex) => (
                      <th key={headerIndex}>{renderInlineText(header)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {segment.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {segment.headers.map((_, cellIndex) => (
                        <td key={cellIndex}>{renderInlineText(row[cellIndex] || "-")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <div className="chat-md-text" key={`text-${segmentIndex}`}>
            {segment.lines.map((line, lineIndex) => {
              const trimmed = line.trim();
              if (!trimmed) return <br key={lineIndex} />;
              const isHeading = /^#{1,6}\s/.test(trimmed);
              return (
                <div className={isHeading ? "chat-md-heading" : undefined} key={lineIndex}>
                  {renderInlineText(trimmed)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const CHAT_MESSAGE_CONTENT_STYLES = `
  .chat-md { display:flex; flex-direction:column; gap:4px; }
  .chat-md-text { display:flex; flex-direction:column; gap:2px; }
  .chat-md-heading { font-weight:800; color:#a7f3d0; margin:2px 0 4px; }
  .chat-md-table-wrap { width:100%; overflow:auto; border:1px solid rgba(34,197,94,.2); border-radius:8px; margin:6px 0; background:#0b1220; }
  .chat-md-table { width:100%; border-collapse:collapse; min-width:340px; white-space:normal; text-align:left; }
  .chat-md-table th { background:#123c2d; color:#86efac; font-weight:800; padding:10px 12px; border-bottom:1px solid rgba(34,197,94,.18); }
  .chat-md-table td { color:#dbe7ef; padding:10px 12px; border-top:1px solid rgba(148,163,184,.12); vertical-align:top; }
  .chat-md-table tr:first-child td { border-top:0; }
  .chat-md-table td, .chat-md-table th { overflow-wrap:anywhere; }
  .u .chat-md-heading { color:#fff; }
  .u .chat-md-table-wrap { border-color:rgba(255,255,255,.2); background:rgba(0,0,0,.08); }
  .u .chat-md-table th { background:rgba(255,255,255,.15); color:#fff; border-bottom-color:rgba(255,255,255,.2); }
  .u .chat-md-table td { color:#fff; border-top-color:rgba(255,255,255,.12); }
`;
