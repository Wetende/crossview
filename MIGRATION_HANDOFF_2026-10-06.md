# Migration handoff — Browser code-lab runtimes prototype

Saved on 6 October 2026 for moving to another machine. **This branch preserves unfinished work; it is not a production acceptance or merge approval.**

## Starting point

- Original checkout: `lms-code-lab-runtimes`
- Original branch: `feat/code-lab-browser-runtimes`
- Original HEAD / snapshot base: `76d55afa0e9353d36ecc562d098e214c17323438`
- Migration branch: `migration/2026-10-06/lms-code-lab-runtimes`
- Scope: existing dirty state only; existing stashes and other local branches were not applied or rewritten.

## Preserved work

Shared engine: Python activity progress, builder editor, player renderer, new codeLabRuntimes utility and tests, plus implementation plan. Verify backend progress semantics and complete player flows before merging.

The original source bytes/deletions are preserved. Source and existing compiled output use separate commits where both exist. No application refactor or feature completion was performed as part of this snapshot.

## Checks actually run

- npm test -- frontend/src/features/course-player/components/Renderers/codeLabRuntimes.test.js: 7 passed, exit 0.
- Python AST parse: 2 changed/new files; 0 errors.
- JavaScript/JSX/TypeScript parser: 4 files parsed; 0 errors.
- Existing Vite manifest: 380 entries; 0 missing file/key references.
- Original git diff HEAD --check: exit 0 (passed).
- Hashes of the original working files were checked against a private local snapshot before any Git mutation.
- Full application tests, production builds, browser flows, migration execution and production-release review were not completed. Do not infer that passing syntax/focused checks covers those gates.

## After cloning

This local branch must be pushed to an approved remote before a GitHub clone can retrieve it. After publication:

```bash
git fetch origin
git switch --track origin/migration/2026-10-06/lms-code-lab-runtimes
```

Read this note, compare the preserved change against the latest integration branch, and select/review source commits. Do not blindly merge the entire historical branch. Refresh builds using the destination revision/dependencies. For shared LMS code, accept canonical LMS first and propagate to AIRADS Virtual/DigikaTech sequentially. Main/integration branches were not advanced by the snapshot operation.

## Files requiring separate transfer

The private original-state snapshot is in the old machine folder `migration-cleanup-2026-10-06/original-state/lms-code-lab-runtimes`. It is not uploaded or included by cloning. Preserve relevant .env files, databases, media, stashes, ignored source/docs and other local branches separately.

## Exact original source paths

- `apps/learning_operations/activity_progress.py`
- `apps/learning_operations/tests/test_activity_progress.py`
- `frontend/src/features/course-builder/editors/CodeLabEditor.jsx`
- `frontend/src/features/course-player/components/Renderers/CodeLabRenderer.jsx`
- `docs/code-lab-browser-runtimes-plan.md`
- `frontend/src/features/course-player/components/Renderers/codeLabRuntimes.js`
- `frontend/src/features/course-player/components/Renderers/codeLabRuntimes.test.js`

## Exact original compiled-output paths

- `static/dist/.vite/manifest.json`
- `static/dist/About-D2a6U4Tv.js`
- `static/dist/Analytics-BmPq2gFc.js`
- `static/dist/AnalyticsIndex-YnU95Fra.js`
- `static/dist/Assessments-pZ_jD4hP.js`
- `static/dist/Assignments-CjVolJTj.js`
- `static/dist/Branding-DsAGnNHg.js`
- `static/dist/Builder-CSbZSBoC.js`
- `static/dist/Builder-DPNGq9ya.js`
- `static/dist/Builder-mb12bbHH.js`
- `static/dist/Cart-D2u-lBF0.js`
- `static/dist/CertificateBuilderWorkspace-BVOgiovp.js`
- `static/dist/CertificateVerification-ClYuswju.js`
- `static/dist/CertificateVerify-p0dNjTUh.js`
- `static/dist/Certificates-DuRIFaet.js`
- `static/dist/Checkout-Cd5vt5N1.js`
- `static/dist/Checkout-Dha2LEz6.js`
- `static/dist/Contact-Al4rHAMy.js`
- `static/dist/Conversation-BPXIrJl0.js`
- `static/dist/Create-BNbXGBoC.js`
- `static/dist/Create-BRnIiJyC.js`
- `static/dist/Create-Bjt8g1Op.js`
- `static/dist/Create-CDm6bF_2.js`
- `static/dist/Create-DJdKK0wL.js`
- `static/dist/CurriculumTree-CqGJ5Ipp.js`
- `static/dist/Dashboard-BMDre-O_.js`
- `static/dist/Detail-CqH4oozo.js`
- `static/dist/Detail-Dvd-K6dJ.js`
- `static/dist/Detail-_O_dr43p.js`
- `static/dist/Edit-D7xlVkuM.js`
- `static/dist/Edit-pkGYRuuU.js`
- `static/dist/EventDetail-DbnleZPv.js`
- `static/dist/Events-OAMoEFD8.js`
- `static/dist/Footer-BTQT0Ocs.js`
- `static/dist/ForgotPassword-CT1iwfec.js`
- `static/dist/Form-B2Diwzcz.js`
- `static/dist/Form-Dn1-9dea.js`
- `static/dist/Form-Du-YhpbH.js`
- `static/dist/Global-B7RX8PGZ.js`
- `static/dist/Grade-DSZJ0qQN.js`
- `static/dist/Home-CDI0hYqa.js`
- `static/dist/Inbox-BmxDo1CF.js`
- `static/dist/Index-B3whWMmy.js`
- `static/dist/Index-BETur1hD.js`
- `static/dist/Index-BYxDGSd-.js`
- `static/dist/Index-BkxVwfXe.js`
- `static/dist/Index-BlFF8pK_.js`
- `static/dist/Index-BvS111qr.js`
- `static/dist/Index-ByoT-G_W.js`
- `static/dist/Index-C7bvKRoX.js`
- `static/dist/Index-CEHE6Sd8.js`
- `static/dist/Index-CM2l34Cq.js`
- `static/dist/Index-CknAnHfP.js`
- `static/dist/Index-CpA9pemT.js`
- `static/dist/Index-D3y1y_zB.js`
- `static/dist/Index-DAHdXJdv.js`
- `static/dist/Index-DGmW2f7x.js`
- `static/dist/Index-DhdyDKCF.js`
- `static/dist/Index-Dsfr23lU.js`
- `static/dist/Index-HxcEvRUk.js`
- `static/dist/Index-U_ziObWI.js`
- `static/dist/Index-cDUCueWs.js`
- `static/dist/Index-eAahv-zl.js`
- `static/dist/Index-jnW_kHic.js`
- `static/dist/Index-oOCtqGd1.js`
- `static/dist/Index-w60lq1Sf.js`
- `static/dist/InstructorLayout-BX54BUM3.js`
- `static/dist/InvitationAccept-wZMbTnJL.js`
- `static/dist/Landing-CYe-Z-lA.js`
- `static/dist/LazyReactPlayer-DUEud7Wl.js`
- `static/dist/LectureView-D3ourat5.js`
- `static/dist/Login-CUYlBZBe.js`
- `static/dist/NewConversation-D39RIWx_.js`
- `static/dist/Operations-iBG1RycV.js`
- `static/dist/OrderDetail-BvMwKty8.js`
- `static/dist/Orders-CMOLEOjl.js`
- `static/dist/Orders-D0DnHKMu.js`
- `static/dist/PaymentPending-CD3GA6Er.js`
- `static/dist/PlatformLogo-C6vZiWcx.js`
- `static/dist/Profile-DtUO708e.js`
- `static/dist/ProgramDetail-BJn_mkQc.js`
- `static/dist/ProgramGrid-C2iJP5Lq.js`
- `static/dist/Programs-BSj1wUMW.js`
- `static/dist/ProgramsSection-Coa2FnWE.js`
- `static/dist/PublicNavbar-CPks-F6z.js`
- `static/dist/PublicProgramCard-8-nBCcpJ.js`
- `static/dist/QuestionLibraryWorkspace-CwQZnpnD.js`
- `static/dist/QuizResultsRenderer-B5WkY7dI.js`
- `static/dist/Quizzes-jGGd_hQw.js`
- `static/dist/Register-m81yPXRJ.js`
- `static/dist/ReportPrint-v3M9Y7F0.js`
- `static/dist/ReportsIndex-DLG6iymK.js`
- `static/dist/ResetPassword-CGYLgMiI.js`
- `static/dist/Results-BQ0snjZh.js`
- `static/dist/Results-k_dji2Qb.js`
- `static/dist/Review-sE-dEzSB.js`
- `static/dist/Reviews-Dw-oBYba.js`
- `static/dist/RichTextContent-CpAjlcDW.js`
- `static/dist/RichTextEditor-BsRCcAWY.js`
- `static/dist/RichTextEditorImpl-4OIHtU8A.js`
- `static/dist/RubricForm-DHHacgg5.js`
- `static/dist/Show-C5Y8GVTo.js`
- `static/dist/Show-CW9mEo2j.js`
- `static/dist/Show-CrRHZL3e.js`
- `static/dist/Show-Dsu7uQrW.js`
- `static/dist/StudentProgress-DFIHe18v.js`
- `static/dist/Submissions-CE3x5wIi.js`
- `static/dist/Take-BqOXcrqy.js`
- `static/dist/Take-Dqe2fMPz.js`
- `static/dist/Upload-DGTxQew6.js`
- `static/dist/VerifyCertificate-BY4te08N.js`
- `static/dist/View-CUWleddd.js`
- `static/dist/Wishlist-BkQUoMBQ.js`
- `static/dist/Wishlist-Dmjlq0sm.js`
- `static/dist/index-BHLl9jXG.js`
- `static/dist/index-BgnuKInq.js`
- `static/dist/learningSelection-D2D_p9H5.js`
- `static/dist/libraryQuestion-tqYNawIi.js`
- `static/dist/main-Km8pu2Xx.js`
- `static/dist/quizRendererUtils-DNSHGYFn.js`
- `static/dist/react-DzIqgfO3.js`
- `static/dist/richTextMath-DdkyUf1h.js`
- `static/dist/useCurrency-CR6J-65W.js`
- `static/dist/About-BWbtaOU3.js`
- `static/dist/Analytics-BJ2hdbjv.js`
- `static/dist/AnalyticsIndex-obQALw6W.js`
- `static/dist/Assessments-hSsGu2gv.js`
- `static/dist/Assignments-CIia61fA.js`
- `static/dist/Branding-Bj7Rtqkf.js`
- `static/dist/Builder-BgIuwddD.js`
- `static/dist/Builder-DZ1g3AxL.js`
- `static/dist/Builder-nqaI6ii4.js`
- `static/dist/Cart-ByV6kOYE.js`
- `static/dist/CertificateBuilderWorkspace-DcrLzVg_.js`
- `static/dist/CertificateVerification-Ch0dDFOy.js`
- `static/dist/CertificateVerify-CSysT8AB.js`
- `static/dist/Certificates-t5af-gxT.js`
- `static/dist/Checkout-CLwSSfAU.js`
- `static/dist/Checkout-MpQHsVlF.js`
- `static/dist/Contact-CuNGAFdt.js`
- `static/dist/Conversation-BX8GGh7Y.js`
- `static/dist/Create-BGAx_YNl.js`
- `static/dist/Create-Bycz_KA1.js`
- `static/dist/Create-DCQqaUHI.js`
- `static/dist/Create-DWdKx3iM.js`
- `static/dist/Create-Nl-ppWVz.js`
- `static/dist/CurriculumTree-CSXmPd5t.js`
- `static/dist/Dashboard-CVZv7P1N.js`
- `static/dist/Detail-CDpywSGo.js`
- `static/dist/Detail-CNlxUN_p.js`
- `static/dist/Detail-CO12FWVC.js`
- `static/dist/Edit-B0-mDVff.js`
- `static/dist/Edit-WwZss1HB.js`
- `static/dist/EventDetail-Doxo1v5j.js`
- `static/dist/Events-DXYjqmjQ.js`
- `static/dist/Footer-DMzAsslY.js`
- `static/dist/ForgotPassword-DerFOQwp.js`
- `static/dist/Form-BiB_aviM.js`
- `static/dist/Form-CKQPVsGJ.js`
- `static/dist/Form-lPJlGiE7.js`
- `static/dist/Global-Cy03G7X8.js`
- `static/dist/Grade-DnOJodfL.js`
- `static/dist/Home-D679G7se.js`
- `static/dist/Inbox-CK1Z8dSx.js`
- `static/dist/Index-3U5JpdVE.js`
- `static/dist/Index-3kM0MzNn.js`
- `static/dist/Index-BMsRph5Y.js`
- `static/dist/Index-BP78LFBU.js`
- `static/dist/Index-BYJ382W_.js`
- `static/dist/Index-Bhp4FO-0.js`
- `static/dist/Index-C8NRDjLU.js`
- `static/dist/Index-CHuiPvqK.js`
- `static/dist/Index-CJw7sfk_.js`
- `static/dist/Index-CVKBxNAF.js`
- `static/dist/Index-CVnzvy6-.js`
- `static/dist/Index-Cj24ET36.js`
- `static/dist/Index-CjufLzK0.js`
- `static/dist/Index-Cy6bGChJ.js`
- `static/dist/Index-CzGBv4tu.js`
- `static/dist/Index-D6XWRkEy.js`
- `static/dist/Index-DAFhdNKE.js`
- `static/dist/Index-G0dFvPj0.js`
- `static/dist/Index-KHn8OxFp.js`
- `static/dist/Index-LexKbY1p.js`
- `static/dist/Index-QTwp0H5j.js`
- `static/dist/Index-XhnxpNYz.js`
- `static/dist/Index-_o5jb_bU.js`
- `static/dist/Index-i6p0E440.js`
- `static/dist/InstructorLayout-KUT8sz87.js`
- `static/dist/InvitationAccept-KY6N6F7u.js`
- `static/dist/Landing-DQY0efep.js`
- `static/dist/LazyReactPlayer-IsXOrckt.js`
- `static/dist/LectureView-C5DzWJDK.js`
- `static/dist/Login-CiPfxygw.js`
- `static/dist/NewConversation-Cn-c5OgL.js`
- `static/dist/Operations-UJ-UjgU-.js`
- `static/dist/OrderDetail-Cota4aZZ.js`
- `static/dist/Orders-BSMGq7PX.js`
- `static/dist/Orders-DVb_gklH.js`
- `static/dist/PaymentPending-Bw8M1RVb.js`
- `static/dist/PlatformLogo-Bzfmu3nF.js`
- `static/dist/Profile-DNtRUxFd.js`
- `static/dist/ProgramDetail-Dgl7w8yr.js`
- `static/dist/ProgramGrid-BICzYjJz.js`
- `static/dist/Programs-CHGyjRdV.js`
- `static/dist/ProgramsSection-BFdr1zFZ.js`
- `static/dist/PublicNavbar-BfUDlr7P.js`
- `static/dist/PublicProgramCard-BcetSTAF.js`
- `static/dist/QuestionLibraryWorkspace-BcP-JeV9.js`
- `static/dist/QuizResultsRenderer-D3s54NFK.js`
- `static/dist/Quizzes-RSNYVtoc.js`
- `static/dist/Register-CsHsaEAI.js`
- `static/dist/ReportPrint-FG6dh_Vl.js`
- `static/dist/ReportsIndex-DI1i4MbA.js`
- `static/dist/ResetPassword-C0OTxwH9.js`
- `static/dist/Results-3O7FDS0y.js`
- `static/dist/Results-DBX9jRzi.js`
- `static/dist/Review-CPMUcF9E.js`
- `static/dist/Reviews-DZhKPD2r.js`
- `static/dist/RichTextContent-B5pZkVYm.js`
- `static/dist/RichTextEditor-BqzebdkQ.js`
- `static/dist/RichTextEditorImpl-CiuZH4GB.js`
- `static/dist/RubricForm-CWkoySmi.js`
- `static/dist/Show-CROnBvwp.js`
- `static/dist/Show-CX1QN1LI.js`
- `static/dist/Show-D6yF2aEs.js`
- `static/dist/Show-vK9R2p30.js`
- `static/dist/StudentProgress-CCZvPf9_.js`
- `static/dist/Submissions-BivyAyfX.js`
- `static/dist/Take-ByzGVp_N.js`
- `static/dist/Take-DkhVxgc9.js`
- `static/dist/Upload-BbQT2VS2.js`
- `static/dist/VerifyCertificate-9MgZjPfo.js`
- `static/dist/View-BkDGNY3f.js`
- `static/dist/Wishlist-BLa57uA8.js`
- `static/dist/Wishlist-D9XTLo0G.js`
- `static/dist/index-BwgXtoei.js`
- `static/dist/index-CDv6Qkkx.js`
- `static/dist/learningSelection-B7HxmfFu.js`
- `static/dist/libraryQuestion-DzldieG9.js`
- `static/dist/main-B9iHjTdx.js`
- `static/dist/quizRendererUtils-BuI2xzZN.js`
- `static/dist/react-CR59Ycc1.js`
- `static/dist/richTextMath-CCF-Evij.js`
- `static/dist/useCurrency-DAC2syb6.js`
