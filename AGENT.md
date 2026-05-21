# AGENT.md — Claude Gateway: تعليمات إعادة البناء الكاملة

  هذا الملف موجّه لـ **Replit Agent**. إذا استلمت هذا الملف، اتبع الخطوات أدناه حرفياً لإعادة بناء المشروع كاملاً من الصفر على حساب Replit جديد.

  ---

  ## نظرة عامة على المشروع

  **Claude Gateway** هو موقع ويب يسمح للمطورين بإنشاء API keys خاصة بهم، واستخدامها للتواصل مع نموذج `claude-opus-4-7` من Anthropic عبر endpoint متوافق تماماً مع تنسيق OpenAI.

  ### المنتج النهائي يتكون من:
  1. **واجهة ويب داكنة** (React + Vite + shadcn/ui) تعرض لوحة تحكم لإدارة API keys
  2. **API Server** (Express 5) يتضمن:
     - CRUD لإدارة API keys
     - Endpoint متوافق مع OpenAI: `POST /api/v1/chat/completions`
  3. **قاعدة بيانات PostgreSQL** تخزن المفاتيح (مشفّرة بـ SHA-256)

  ---

  ## الـ Stack التقني

  | الطبقة | التقنية |
  |--------|---------|
  | Frontend | React + Vite + TypeScript + shadcn/ui + TanStack Query + wouter |
  | Backend | Express 5 + TypeScript |
  | Database | PostgreSQL + Drizzle ORM + drizzle-zod |
  | AI | Anthropic Claude claude-opus-4-7 عبر Replit AI Integrations |
  | Validation | Zod v4 |
  | API Contract | OpenAPI spec + Orval codegen |
  | Monorepo | pnpm workspaces |

  ---

  ## تعليمات Replit Agent: كيف تُعيد البناء

  ### الخطوة 1 — أنشئ قاعدة البيانات

  في sandbox الكود:
  ```javascript
  const result = await createDatabase();
  console.log(result);
  ```

  ### الخطوة 2 — فعّل Anthropic AI Integration

  في sandbox الكود:
  ```javascript
  const result = await setupReplitAIIntegrations({
      providerSlug: "anthropic",
      providerUrlEnvVarName: "AI_INTEGRATIONS_ANTHROPIC_BASE_URL",
      providerApiKeyEnvVarName: "AI_INTEGRATIONS_ANTHROPIC_API_KEY"
  });
  console.log(result);
  ```

  ### الخطوة 3 — أنشئ الـ Artifacts

  **API Server:**
  ```javascript
  const result = await createArtifact({
      artifactType: "api",
      slug: "api-server",
      previewPath: "/api",
      title: "API Server"
  });
  ```

  **Frontend:**
  ```javascript
  const result = await createArtifact({
      artifactType: "react-vite",
      slug: "claude-gateway",
      previewPath: "/",
      title: "Claude API Gateway"
  });
  ```

  ### الخطوة 4 — انسخ محتوى ملفات المشروع

  انسخ كل الملفات الموجودة في هذا الريبو إلى المسارات المناظرة لها في Replit.

  ### الخطوة 5 — شغّل الأوامر بالترتيب

  ```bash
  # 1. تثبيت الحزم
  pnpm install --no-frozen-lockfile

  # 2. توليد الكود من OpenAPI spec
  pnpm --filter @workspace/api-spec run codegen

  # 3. رفع schema قاعدة البيانات
  pnpm --filter @workspace/db run push
  ```

  ### الخطوة 6 — شغّل الـ Workflows

  - `pnpm --filter @workspace/api-server run dev` — API Server
  - `pnpm --filter @workspace/claude-gateway run dev` — Frontend

  ---

  ## قواعد مهمة

  1. **لا تعرض المفاتيح في plaintext** — يُخزّن SHA-256 hash فقط، المفتاح الكامل يُعرض مرة واحدة
  2. **لا ترسل `temperature` أو `top_p` أو `top_k`** لـ claude-opus-4-7 — يُرجع خطأ 400
  3. **الـ endpoint** هو `/api/v1/chat/completions` وليس `/v1/chat/completions`
  4. **بعد أي تغيير في `openapi.yaml`** — شغّل codegen مباشرة
  5. **`AI_INTEGRATIONS_ANTHROPIC_API_KEY`** هو dummy string — الـ base URL هو المهم

  ---

  ## مثال curl للتجربة بعد الانتهاء

  ```bash
  # أنشئ API key
  curl https://YOUR_REPLIT_DOMAIN/api/apikeys \
    -H "Content-Type: application/json" \
    -d '{"name": "test-key"}'

  # استخدم الـ key
  curl https://YOUR_REPLIT_DOMAIN/api/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer sk-cgw-YOUR_KEY_HERE" \
    -d '{
      "model": "claude-opus-4-7",
      "messages": [{"role": "user", "content": "مرحبا، عطني نصيحة سريعة لليوم."}]
    }'
  ```

  ---

  ## متغيرات البيئة المطلوبة

  | المتغير | المصدر |
  |---------|--------|
  | `DATABASE_URL` | تلقائي من Replit PostgreSQL |
  | `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | تلقائي من Replit AI Integrations |
  | `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | تلقائي من Replit AI Integrations |
  | `PORT` | يُعيّن تلقائياً من workflow |
  | `BASE_PATH` | يُعيّن تلقائياً من workflow |
  