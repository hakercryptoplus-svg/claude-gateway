# Claude Gateway

  موقع ويب احترافي يتيح للمطورين إنشاء API keys للوصول إلى Claude claude-opus-4-7 عبر endpoint متوافق مع OpenAI.

  ## المميزات

  - إنشاء وحذف API keys من لوحة تحكم داكنة الطابع
  - عرض المفتاح الكامل مرة واحدة فقط مع تحذير واضح
  - أمر curl جاهز للنسخ فور إنشاء المفتاح
  - Endpoint متوافق 100% مع تنسيق OpenAI
  - إحصائيات حية: عدد المفاتيح، المفاتيح النشطة، إجمالي الطلبات

  ## الاستخدام

  ```bash
  curl https://YOUR_DOMAIN/api/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -d '{
      "model": "claude-opus-4-7",
      "messages": [{"role": "user", "content": "مرحبا"}]
    }'
  ```

  ## إعادة البناء على Replit

  اقرأ `AGENT.md` وأرسله لـ Replit Agent — سيبني كل شيء تلقائياً.

  ## Stack

  - React + Vite + shadcn/ui + TanStack Query
  - Express 5 + TypeScript
  - PostgreSQL + Drizzle ORM
  - Anthropic Claude claude-opus-4-7 (عبر Replit AI Integrations)
  - pnpm workspaces monorepo
  