import { useParams } from "react-router-dom";
import { useEffect } from "react";

export default function ChatPage() {
  const { bot_id } = useParams<{ bot_id: string }>();

  useEffect(() => {
    if (bot_id) {
      const scriptSettings = document.createElement("script");
      scriptSettings.innerHTML = `window.lovableSettings = { botId: '${bot_id}' };`;
      document.body.appendChild(scriptSettings);

      const scriptWidget = document.createElement("script");
      scriptWidget.src = "https://cdn.lovable.ai/widget.js";
      scriptWidget.async = true;
      document.body.appendChild(scriptWidget);
    }
  }, [bot_id]);

  return (
    <main className="flex justify-center items-center h-screen">
      <p>Loading assistant...</p>
    </main>
  );
}
