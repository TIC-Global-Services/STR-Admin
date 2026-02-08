src/
├── main.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
|
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
|
├── common/
│   ├── decorators/
│   │   ├── permissions.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── current-user.decorator.ts
│   │
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── permissions.guard.ts
│   │   └── super-admin.guard.ts
│   │
│   ├── interceptors/
│   │   └── audit-log.interceptor.ts
│   │
│   ├── enums/
│   │   ├── role.enum.ts
│   │   ├── permission.enum.ts
│   │   └── membership-status.enum.ts
│   │
│   └── utils/
│       └── membership-id.util.ts
|
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── guards/
│   │   └── local-auth.guard.ts
│   └── dto/
│       ├── login.dto.ts
│       └── refresh-token.dto.ts
|
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── repositories/
│   │   └── users.repository.ts
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── role.entity.ts
│   │   └── permission.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── assign-role.dto.ts
|
├── content/
│   ├── content.module.ts
│   └── news/
│       ├── news.module.ts
│       ├── news.controller.ts
│       ├── news.service.ts
│       ├── entities/
│       │   └── news.entity.ts
│       └── dto/
│           ├── create-news.dto.ts
│           └── update-news.dto.ts
|
├── social/
│   ├── social.module.ts
│   │
│   ├── instagram/
│   │   ├── instagram.module.ts
│   │   ├── instagram.controller.ts
│   │   ├── instagram.service.ts
│   │   ├── entities/
│   │   │   └── instagram-post.entity.ts
│   │   └── dto/
│   │       └── create-instagram.dto.ts
│   │
│   └── x/
│       ├── x.module.ts
│       ├── x.controller.ts
│       ├── x.service.ts
│       ├── entities/
│       │   └── x-post.entity.ts
│       └── dto/
│           └── create-x.dto.ts
|
├── membership/
│   ├── membership.module.ts
│   ├── membership.controller.ts
│   ├── membership.service.ts
│   ├── entities/
│   │   └── membership.entity.ts
│   ├── dto/
│   │   ├── apply-membership.dto.ts
│   │   ├── approve-membership.dto.ts
│   │   └── reject-membership.dto.ts
│   └── public/
│       └── membership-public.controller.ts
|
├── analytics/
│   ├── analytics.module.ts
│   ├── membership-analytics.controller.ts
│   └── membership-analytics.service.ts

└── audit/
    ├── audit.module.ts
    ├── audit.controller.ts
    └── audit.service.ts
