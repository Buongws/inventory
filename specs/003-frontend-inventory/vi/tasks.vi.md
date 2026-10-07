# Tasks: Frontend Inventory Management

## Phạm vi học FE hiện tại — điều chỉnh của người dùng, 2026-10-07

Mục tiêu đang áp dụng: sidebar trái, table tồn kho/pagination server, Inventory drawer từng sản phẩm, form nhập/xuất và lịch sử bất biến. Giữ auth/phân quyền hiện có, key/payload cố định khi retry thủ công và chống submit trùng. Kiểm chứng luồng nhập/xuất thường, validation, quyền admin/customer, lỗi API/read cơ bản và retry không tạo movement thứ hai. Giữ bằng chứng đã đạt, không chạy lại hành vi code không đổi.

Race response/modal/session/latch phức tạp, bfcache/lifecycle trình duyệt, clock/deadline/expiry và auth/refresh fault matrix chuyển **DEFERRED** (D001–D004 trong tasks). Giữ implementation và bằng chứng lịch sử có giới hạn; đổi ưu tiên kiểm chứng, không đổi backend contract hoặc yêu cầu bỏ guard. Deferred/chưa chạy không là PASS, không chặn mục tiêu học FE. Không thêm helper/proxy fault hay kiểm chứng nâng cao; converge chỉ khi người dùng yêu cầu riêng. Các scenario chi tiết cũ bên dưới là tham chiếu phạm vi đầy đủ/lịch sử khi vượt điều chỉnh này.


**Input**: `specs/003-frontend-inventory/` | **Generated**: 2026-10-06 | **Status / Trạng thái**: T001–T029 retained/completed; basic learning UI implemented. T030 basic smoke completed with retained and new evidence; T031 scope/documentation complete. D001–D004 deferred. T030 cleanup: disposable stack stopped with data retained; direct DEV URL http://localhost:3002/inventory.

Ngôn ngữ: [English](../tasks.md) | **Tiếng Việt**

**Prerequisites**: [plan](plan.vi.md), [spec](spec.vi.md), [research](research.vi.md), [states](data-model.vi.md), [UI contract](../contracts/ui-contract.vi.md), [quickstart](quickstart.vi.md), constitution.

Không thêm test tự động. Task verification là manual real browser/Gateway/PostgreSQL hoặc quality gates, không tạo test files. Không sửa backend/migration/search. Chỉ tasks Anh–Việt được tạo trong lượt này.

Mọi task có ID/path/dependency và tiêu chí chấp nhận trong mô tả. [P] chỉ sau prerequisites, file khác không trùng; không cho chạy chung tasks ghi evidence. tasks.md backlog chuẩn, vi mirrorID/order/status.

## Phase 1: Setup

- [X] T001 Kiểm tra Node24/install độc lập/conventions và PostgreSQL/Redis riêng đã migrate; khởi tạo evidence hai ngôn ngữ mọi scenario NOT RUN, không đổi dữ liệu chung. Files: `package.json`, `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: none.
- [X] T002 Chỉ cài antd6.6.5/nextjs-registry1.3.0 trong web; npm ls peers/cssinjs/React, không v5patch/dependency thừa; ghi versions thực. Files: `apps/web/package.json`, `apps/web/package-lock.json`. Depends on: T001.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 2: Nền tảng — chặn mọi story

- [X] T003 [P] Thêm AntdRegistry quanh provider, ConfigProvider locale Việt/AntD App trong Redux/bootstrap cũ; compound Ant chỉ client; không store/bootstrap thứ hai. Files: `apps/web/app/layout.tsx`, `apps/web/components/app-provider.tsx`. Depends on: T002.
- [X] T004 [P] Scope CSS form/label/input/button cũ vào auth/dashboard; spacing/overflow/focus tối thiểu, không globalreset; Ant không bị style cũ, auth giữ nguyên. Files: `apps/web/app/globals.css`. Depends on: T002.
- [X] T005 [P] Định nghĩa types product/stock/movement/page/readresource/operationfrozen/status theo model; không APIwrapper/hooksframework/Reduxslice/persist mới. Files: `apps/web/lib/inventory-types.ts`. Depends on: T002.
- [X] T006 [P] Cấu hình Next rewrite /api/v1/:path* tới server-only GATEWAY_ORIGIN(defaultlocalhost3004); validateHTTP(S)origin, example sameorigin NEXT_PUBLIC_API_URL=/api/v1, từ chối config sai. Files: `apps/web/next.config.ts`, `apps/web/.env.local.example`. Depends on: T002.
- [X] T007 Shared Axios base relative/api/v1; metadata actor/deadline chỉ inventory, check trước/saurefresh và ngaytrướcdispatch/401replay; exactkey/body/token-sessionkhớp, singleflight/onereplay; localblockcategory rõ, authkhác giữbehavior. Check operationsignal trước/saurefresh và ngay trước initialdispatch/replay; giữsignalreplay, khôngcancelsharedrefresh. Files: `apps/web/lib/api.ts`. Depends on: T003, T004, T005, T006.
- [X] T008 Kiểm chứng foundation: productioncoldloadregistry/style và login/register/dashboard; rewritecookie/Bearer/RetryAfter/429/502/503; login/refresh/logout/Googleflow(chạy hoặc ghi thiếucredentials), không coi metadata là runtimepass. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T007.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 3: US1 — Tồn có quyền (P1, MVP chỉ đọc)

Kiểm chứng độc lập: US1/AC1–4: waiting/login/customer/admin and 45-product pagination; no movements needed.

- [X] T009 [US1] Tạo route/ownerclient; reuseuseAuth initialized/admin, waiting0request,signedoutlogin/customerdenied; sidebarInventory/dashboard/logout, reminderentry; chưa bậtPOST. Files: `apps/web/app/inventory/page.tsx`, `apps/web/components/inventory-management.tsx`. Depends on: T008.
- [X] T010 [P] [US1] Thêm entryInventory chỉadmin ở dashboard, giữcustomer/login destination; không ProductCRUD/search. Files: `apps/web/components/protected-dashboard.tsx`. Depends on: T009.
- [X] T011 [US1] StockGET/Table productIdrowKey/name/SKU/status/stock/action, localpage/limit/totaldefault1/20 sizes10/20/50/100reset1; safeoffset/empty/loading/error/retry/cancelgenerationactor, khôngzero giả/search/sorter. Files: `apps/web/components/inventory-management.tsx`. Depends on: T009.
- [X] T012 [US1] VerifyUS1/AC1–4/SC001:sessionroles/late403,45products20/20/5total45,size/reset/outofrange/zero/inactive/slow/error/retry/stalepage; khôngmovement; screenshots/network sạch. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T010, T011.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 4: US2 — Drawer/lịch sử (P1)

Kiểm chứng độc lập: US2/AC1–4: existing/empty history and independent 45-fact pagination, no UI writes needed.

- [X] T013 [US2] DrawerUItypedidentity/status/stock và history actorUUID/reason/UTC/type/qty/before/after, khôngeditdelete; loading/empty/error/retry riêng, chưasubmit. Files: `apps/web/components/inventory-drawer.tsx`. Depends on: T012.
- [X] T014 [US2] Wireselectionstock/historyGET,paginationriêngdefault20/resetproduct,size,reopen,giữtable; cancel/invalidateproduct/page/actorcũ,clearunsentdraftclose/reopen; khôngmerge/cache. Files: `apps/web/components/inventory-management.tsx`. Depends on: T013.
- [X] T015 [US2] VerifyUS2/AC1–4/SC002:45facts20/20/5independent; empty/missing/inactive/cataloghiện/UTC/sectionerrors/rapidswitch/late,giữtablepageclose/reopen. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T014.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 5: US3 — Nhập/xuất (P1)

Kiểm chứng độc lập: US3/AC1–5: 10→3→rejected8 leaves7/two facts; inactive and reset/refresh rules.

- [X] T016 [US3] AntFormSelectdefaultRECEIPT,InputNumber/TextAreatrống,enum/numberinteger1..1e6/reasontrim1..500codepoints,INACTIVEallow; newsubmitstockreadykhônghistory,nonterminaldisable; khôngmaxlengthUTF16reject500emoji. Files: `apps/web/components/inventory-drawer.tsx`. Depends on: T015.
- [X] T017 [US3] Trước bậtghi:localconfirm/invalidationclose/mask/Escape/switch/menu/dashboard/logout/login và conditionalbeforeunloadnonterminal; cancelgiữ,confirmdiscardtrướcaction,khôngclaimhủybackend/persist; US5mởlifecycle. Markdiscard/abortoperationsignal trướcclearref/action, chặnrefreshdispatchmuộn. Files: `apps/web/components/inventory-management.tsx`. Depends on: T016.
- [X] T018 [US3] Submit syncreflatch,frozenactor/product/payload,UUIDmỗinewop,firstdispatch+24h; directapiPOSTonekey/actor/deadline/timeout15s; callbackgenerationidentityactor,khôngeffectPOST. Tracklifetimesignal/attemptID/actualdispatchprovenance; luônfinishliveattempt/latch độc lập quyềnUI, giữresultkín. Files: `apps/web/components/inventory-management.tsx`. Depends on: T017.
- [X] T019 [US3] Transitionssuccess/replay/reject:draweropenresetqty/reasonkeeptype; successrefresh3resourceshistory1riêng; stock409reset/reload/blockuntilready;400draftfield; uncertain/transientgiữoperation/guardchoUS4,khôngsilentunlock/keymới. Terminalstockerrorreplaysettleunknown/resetreload; attempt-onlyrejectkhôngsettle. Files: `apps/web/components/inventory-management.tsx`, `apps/web/components/inventory-drawer.tsx`. Depends on: T018.
- [X] T020 [US3] VerifyUS3/AC1–5/SC003/006PGthật:10/3/reject8→7/twofacts,exactstock/INACTIVE/bounds/Unicode500/501,doubleclickonePOST/keymới,historyerrorallow/stockerrorblock,refreshfailGETonly,guardkhighi. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T019.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 6: US4 — Recovery cùng thao tác (P1)

Kiểm chứng độc lập: US4/AC1–5: held/lostresponse same-key recovery one fact; auth/delay/cutoff correctness.

- [X] T021 [US4] RecoveryclassifyIN_PROGRESSriêng;500/502/noresponse/503unknownuncertain;429/API503giữidentity/priorunknown;later400/401/403khôngerase;matching201/404/stock409settle;KEY_REUSEDblockedkhôngkeymới;khôngabandoninplace. Áp bốn hàng authprovenance và Q1 theo contract, khônggom401/403. Files: `apps/web/components/inventory-management.tsx`. Depends on: T020.
- [X] T022 [US4] ManualRetryoneattemptsamefrozenbody/key/latch; RetryAfterseconds/datekhôngshorten; fallback1/2/4/8/16/30s+jitter0–250mscap30; timerdisplayonly/cleanup/noPOST;24hcheckclickdispatch,cutoffblockedreconcile/departure. Files: `apps/web/components/inventory-management.tsx`. Depends on: T021.
- [X] T023 [US4] Authfail/differentadminkhôngautoredirectkhioperation:hidecatalog/history/payload,keepmounted/guardlogin; originaladminrestoreallowretry; localdispatchblockriêng,lateprotectedresultskhôngpublish. Releaseattemptlatchkểcảmấtquyền; giữngầmterminal/recovery, originaladminrestoreapplyterminaloncekhôngPOST hoặcunknownsamekeyretry. Files: `apps/web/components/inventory-management.tsx`. Depends on: T022.
- [X] T024 [US4] UI recoveryAlertsanitized/frozenvalueschooriginaladmincóquyền,countdown/disable/conflict/cutoffreconcile; formnonterminalkhóa,readretryriêng; hiddenviewkhôngpayload. Files: `apps/web/components/inventory-drawer.tsx`. Depends on: T023.
- [X] T025 [US4] VerifyUS4/AC1–5/SC004/007:PGheld→IN_PROGRESS/RetryAfter/samekey; proxylostcommitresponse→onefact/ledger; labelstubs;429/503/500/502/priorunknown/conflict/delay/cutoff/401actorbodydeadline/sameadminrestore/differentadmin0POST/noautoloop/persist. Verifyterminalstockerrorreplaylostresponsesettle,attemptrejectgiữunknown; bốn authcasescó/khôngpriorunknown và POSTresults lúcmấtquyền/đổiactor,releaselatch/nopublish/restore. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T024.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 7: US5 — Bảo vệ rời/quay lại (P1)

Kiểm chứng độc lập: US5/AC1–4: cancel preserves, confirm discards; reload/bfcache sends0 restoredPOST.

- [X] T026 [US5] Hoàn thiệndeparture:modalrecheckidentity,discard/invalidatebeforeaction;pagehide/unmount bắt buộc abort operation signal trước discard/clear refs, timers và reads để ngăn dispatch/replay tiếp theo; abort không chứng minh DB rollback hoặc backend cancellation; persistedpageshowclearoperation/draft/resources,authfreshGET/reminder;khônghistorysentinel/routerpatch. Abortoperationsignaltrướcdiscard/navigation/pagehide/unmount; transactionđãdispatchvẫncóthểcommit. Files: `apps/web/components/inventory-management.tsx`. Depends on: T025.
- [X] T027 [US5] VerifyUS5/AC1–4/SC005mọiclose/mask/Escape/switch/menu/dashboard/logout/login cancelconfirm sending/unknown/blocked; modalresponse/lateafterselectionrace; beforeunloaddefaultkhihỗtrợ,draft/successreadfailnowarning;reload/bfcachefreshGET/reminder0POST/nostorage,nativeBackForwardlimits. Delaypreflightrefresh/confirmdeparture→0initialPOSTsaufinish; delaypost401refresh/depart→0replay; cancelconfirmgiữsameoperation; callback/latchcũkhôngđổinewop. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T026.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Phase 8: Hoàn thiện và kiểm chứng xuyên feature

- [X] T028 Auditkeyboard/focus/label/UTC/Vietnamstates/scroll/productioncoldSSRstylehydration; sửaCSS/providerregression, screenshots sạch và reruncheckảnhhưởng. Files: `apps/web/components/inventory-management.tsx`, `apps/web/components/inventory-drawer.tsx`, `apps/web/app/globals.css`, `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T027.
- [X] T029 Chạyrootcheck lint/format/typecheckmọiapp,build/testshiệnhữu; sửaaffectedfailure/ghiexit/omission;NoTestsFoundabsentkhôngPASS,khôngthêmtest. Files: `package.json`, `apps/web/package.json`, `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T028.
- [X] T030 Smoke cơ bản tùy chọn do người dùng thử tại http://localhost:3102/inventory: login admin thường, sidebar/table/drawer/history, nhập/xuất và validation; customer bị chặn. Giữ bằng chứng luồng code không đổi; không ghi lượt smoke mới PASS khi chưa quan sát. Không fault nâng cao hoặc bắt buộc Google flow. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`. Depends on: T029. Không chặn việc học.
- [X] T031 Ghi phạm vi học FE đã điều chỉnh và tổng kết hai ngôn ngữ: đã làm/đã kiểm chứng/deferred/chưa chạy; giữ bằng chứng lịch sử, dọn helper tạm và để stack dùng thử normal cho người dùng tự thử. Không tuyên bố full advanced acceptance, không converge. Files: `specs/003-frontend-inventory/validation.md`, `specs/003-frontend-inventory/vi/validation.vi.md`, hai bản tasks. Depends on: T029; độc lập T030 tùy chọn.

Checkpoint: hoàn tất/kiểm chứng phase trước phase nối tiếp; không bật POST trước T017 protection.

## Dependencies & Execution Order

```text
T001 → T002 → [T003 || T004 || T005 || T006] → T007 → T008
→ T009 → [T010 || T011] → T012
→ T013 → T014 → T015
→ T016 → T017 → T018 → T019 → T020
→ T021 → T022 → T023 → T024 → T025
→ T026 → T027 → T028 → T029 → [T030 optional | T031 documentation]
```

US1 độc lập movement; US2 dùng history có sẵn không cần UI ghi. Thứ tự US1→US2→US3→US4→US5 là incremental do dùng chung owner/drawer, không cho story cùng sửa một file. Mỗi phase có manual acceptance riêng. T017 bảo vệ ngay trước bật ghi; T026 hoàn tất lifecycle/races/browserreturn, không trì hoãn an toàn cơ bản đến US5.

### Parallel opportunities per story

| Group | Prerequisites | Safe peers | Join |
|---|---|---|---|
| Foundation | T002 | T003 provider/layout, T004 CSS, T005 types, T006 config/env | T007 |
| US1 | T009 | T010 dashboard, T011 stock owner | T012 |
| US2 | T012 | none: drawer then owner integration | T015 |
| US3 | T015 | none: form/owner/guards mutually sequenced | T020 |
| US4 | T020 | none: recovery/auth owner then drawer | T025 |
| US5 | T025 | none: lifecycle then evidence | T027 |

Có năm [P] marker (T003–T006,T010). T011 là peer an toàn của T010 như bảng; không parallel evidence writers hoặc hai chỉnh sửa owner/drawer. Các cơ hội này không yêu cầu spawn agent.

## Requirement and acceptance traceability

| Source | Implementation | Verification |
|---|---|---|
| US1/AC1, FR001, SC001 | T009/T011/T023 | T012/T025 |
| US1/AC2, FR002 | T003/T004/T009/T010/T011 | T008/T012/T028 |
| US1/AC3, FR003, SC002 | T011 | T012 |
| US1/AC4, FR005, SC006 | T011 | T012 |
| US2/AC1, FR004 | T013/T014 | T015 |
| US2/AC2, FR003, SC002 | T013/T014 | T015 |
| US2/AC3, FR005 | T013/T014/T016 | T015/T020 |
| US2/AC4, FR004 | T014 | T015 |
| US3/AC1, FR006/007, SC004 | T016/T018 | T020 |
| US3/AC2, FR006, SC003 | T016/T019 | T020 |
| US3/AC3, FR011 | T019 | T020/T030 |
| US3/AC4, FR009, clarifyQ5 | T019/T021 | T020/T025 |
| US3/AC5, FR005/011, SC006 | T019 | T020 |
| US4/AC1, FR007/010 | T021/T024 | T025 |
| US4/AC2, FR008/010, SC007 | T007/T022/T024 | T025 |
| US4/AC3, FR009 | T021/T024 | T025 |
| US4/AC4, FR008/009 | T019/T021 | T025/T030 |
| US4/AC5, FR015, clarifyQ1 | T007/T023/T024 | T025 |
| US5/AC1, FR012, SC005 | T017/T026 | T020/T027 |
| US5/AC2, FR012/014 | T017/T026 | T027 |
| US5/AC3, FR013 | T017/T026 | T027 |
| US5/AC4, FR014 | T009/T026 | T027 |
| clarifyQ2 stock ready/history error | T014/T016/T019 | T020 |
| clarifyQ3 success reset | T019 | T020 |
| clarifyQ4 no in-place abandon | T021/T024 | T025/T027 |
| FR016, constitution, no tests/scope | T001/T002/T005 | T029/T030/T031 |
| plan registry/styles/accessibility | T002/T003/T004 | T008/T028/T029 |
| plan rewrite/cookies/Retry-After | T006/T007 | T008/T025/T030 |
| plan actor/deadline/interceptor races | T007/T018/T022/T023 | T025 |
| plan late callbacks/modal/bfcache | T014/T018/T026 | T015/T027 |

## Implementation Strategy

1. Setup/foundation rồi US1 read-only MVP, chứng minh quyền và pagination trước drawer/write.
2. US2 bổ sung drawer/history; dùng existing facts kiểm chứng độc lập.
3. US3 thêm form/guard trướcPOST/normaloutcomes; lỗi unknown giữ khóa để US4 hoàn thiện recovery. Không coi US3 là toàn bộ feature đã sẵn sàng.
4. US4 chứng minh same-key/manualretry/auth/deadline; US5 đủ departure/races/bfcache.
5. Polish/quality/fullregression/map evidence; checkbox chỉ khi đúng implementation+evidence. Không commit/deploy/migration chỉ vì tasks tồn tại.

## Generation outcome

31 tasks: setup2,foundation6,US1=4,US2=3,US3=5,US4=5,US5=2,polish4. Năm [P]. Toàn bộ checkbox chưa chạy; paths/dependency/labels/traceability/parity được kiểm tra khi tạo, không runtimepass. Không extensions.yml, bỏ qua trước/sau tasks hooks. Chỉ tạo tasks.md/vi/tasks.vi.md. Bước tiếp theo khi được yêu cầu: `$speckit-analyze`.

## Kiểm chứng deferred — không tự chạy

Các checkbox chưa đánh dấu này nghĩa là deferred, không PASS hoặc yêu cầu chạy lại bằng chứng cũ. Chỉ tiếp tục khi người dùng yêu cầu riêng; hiện không tạo helper/fault mới.

- [ ] D001 DEFERRED: response chồng lấp/stale phức tạp, modal/new-operation race, publish theo actor và callback/latch cũ. Giữ bằng chứng T012/T015/T025/T027 với giới hạn đã ghi.
- [ ] D002 DEFERRED: bfcache, native beforeunload/BackForward/reload và khác biệt browser. Quan sát Chrome thật T027 là bằng chứng lịch sử, không PASS phổ quát.
- [ ] D003 DEFERRED: kiểm chứng FE clock/deadline và expiry idempotency backend. Giữ giới hạn bằng chứng expiry seed/clock tạm; không claim đã chờ thật24h.
- [ ] D004 DEFERRED: bốn nhánh auth/refresh fault, đổi actor/mất quyền, late completion/phục hồi session. Auth thường/quyền admin/customer vẫn thuộc phạm vi cơ bản.
