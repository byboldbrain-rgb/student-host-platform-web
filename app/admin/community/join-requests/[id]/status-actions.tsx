"use client";

import { useState } from "react";

export default function StatusActions({
  requestId,
  currentStatus,
}: {
  requestId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: string) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/community/join-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const text = await res.text();

      let result: any = {};
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!res.ok) {
        throw new Error(result.error || "Failed to update status");
      }

      setStatus(nextStatus);
      setMessage("Status updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-[#e8ebf2] bg-[#fafbff] p-5">
      <p className="text-sm font-bold text-[#20212a]">Change Status</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("reviewed")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            status === "reviewed"
              ? "bg-amber-500 text-white"
              : "bg-white text-[#20212a] border border-[#dbe1ea]"
          }`}
        >
          Mark Reviewed
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("accepted")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            status === "accepted"
              ? "bg-green-600 text-white"
              : "bg-white text-[#20212a] border border-[#dbe1ea]"
          }`}
        >
          Accept
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("rejected")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            status === "rejected"
              ? "bg-red-600 text-white"
              : "bg-white text-[#20212a] border border-[#dbe1ea]"
          }`}
        >
          Reject
        </button>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-semibold text-green-600">{message}</p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}