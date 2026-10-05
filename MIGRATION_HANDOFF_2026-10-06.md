# Migration handoff — Managed Inertia page titles

Saved on 6 October 2026 for moving to another machine. **This branch preserves unfinished work; it is not a production acceptance or merge approval.**

## Starting point

- Original checkout: `lms-inertia-title`
- Original branch: `fix/inertia-managed-title`
- Original HEAD / snapshot base: `b94a468c4fede86ad5eda75d695a2032bcf615ee`
- Migration branch: `migration/2026-10-06/lms-inertia-title`
- Scope: existing dirty state only; existing stashes and other local branches were not applied or rewritten.

## Preserved work

Shared engine: title management in the React entry point and Django base template. Review against current canonical LMS before sequential product propagation.

The original source bytes/deletions are preserved. Source and existing compiled output use separate commits where both exist. No application refactor or feature completion was performed as part of this snapshot.

## Checks actually run

- JavaScript/JSX/TypeScript parser: 1 files parsed; 0 errors.
- Existing Vite manifest: 296 entries; 0 missing file/key references.
- Original git diff HEAD --check: exit 0 (passed).
- Hashes of the original working files were checked against a private local snapshot before any Git mutation.
- Full application tests, production builds, browser flows, migration execution and production-release review were not completed. Do not infer that passing syntax/focused checks covers those gates.

## After cloning

This local branch must be pushed to an approved remote before a GitHub clone can retrieve it. After publication:

```bash
git fetch origin
git switch --track origin/migration/2026-10-06/lms-inertia-title
```

Read this note, compare the preserved change against the latest integration branch, and select/review source commits. Do not blindly merge the entire historical branch. Refresh builds using the destination revision/dependencies. For shared LMS code, accept canonical LMS first and propagate to AIRADS Virtual/DigikaTech sequentially. Main/integration branches were not advanced by the snapshot operation.

## Files requiring separate transfer

The private original-state snapshot is in the old machine folder `migration-cleanup-2026-10-06/original-state/lms-inertia-title`. It is not uploaded or included by cloning. Preserve relevant .env files, databases, media, stashes, ignored source/docs and other local branches separately.

## Exact original source paths

- `frontend/src/main.jsx`
- `templates/base.html`

## Exact original compiled-output paths

- `static/dist/.vite/manifest.json`
- `static/dist/About-f0SQEudh.js`
- `static/dist/Assessments-CP6zu5pS.js`
- `static/dist/Assignments-C_ZC7Eyn.js`
- `static/dist/Branding-BSwhFdJH.js`
- `static/dist/Builder-Be1o1P53.js`
- `static/dist/Builder-CBrs-C21.js`
- `static/dist/Builder-DRCSnJw1.js`
- `static/dist/Cart-DddKtY9s.js`
- `static/dist/CertificateBuilderWorkspace-xTn14dQQ.js`
- `static/dist/CertificateVerification-DmfQerI1.js`
- `static/dist/CertificateVerify-DH9FSpWQ.js`
- `static/dist/Certificates-BJn5GfD4.js`
- `static/dist/Checkout-CVwOJJS6.js`
- `static/dist/Checkout-Cqdpq_Xe.js`
- `static/dist/Contact-CTIyIR39.js`
- `static/dist/Conversation-EN6_fXTf.js`
- `static/dist/Create-3qEzbH38.js`
- `static/dist/Create-BR8uwy_F.js`
- `static/dist/Create-CgDTZvrA.js`
- `static/dist/Create-CkE4BefV.js`
- `static/dist/Create-DWjrGhVj.js`
- `static/dist/CurriculumTree-jqPObDuL.js`
- `static/dist/Dashboard-BAWL4cSu.js`
- `static/dist/Detail-Dtf-TCGG.js`
- `static/dist/Detail-Rvq7tElb.js`
- `static/dist/Detail-bqTHYyS_.js`
- `static/dist/Edit-DyAELMhG.js`
- `static/dist/Edit-ayi5cnWD.js`
- `static/dist/EventDetail-CNXSYF2A.js`
- `static/dist/Events-CjiHQmME.js`
- `static/dist/Footer-BRQjHmrT.js`
- `static/dist/ForgotPassword-3-fTyqjU.js`
- `static/dist/Form--6s7SP_C.js`
- `static/dist/Form-0ShRc8ok.js`
- `static/dist/Form-D4SZ5Cde.js`
- `static/dist/Global-CZe9pf8_.js`
- `static/dist/GoogleIdentityScript-CnSeoiCv.js`
- `static/dist/Grade-D7R80s_h.js`
- `static/dist/Home-BXuRaVUW.js`
- `static/dist/Inbox-CHdZ9lL2.js`
- `static/dist/Index-9fPjlZuk.js`
- `static/dist/Index-BMkN6TL9.js`
- `static/dist/Index-BNNkzow2.js`
- `static/dist/Index-BT8CA9ji.js`
- `static/dist/Index-BV5btsCs.js`
- `static/dist/Index-BV_tjHrZ.js`
- `static/dist/Index-Bldp-zne.js`
- `static/dist/Index-Bsu2T7Lp.js`
- `static/dist/Index-BzH7N3Vd.js`
- `static/dist/Index-C3a7PnIR.js`
- `static/dist/Index-C4KdCmn9.js`
- `static/dist/Index-C4aNvSBQ.js`
- `static/dist/Index-C5cw7kF4.js`
- `static/dist/Index-C6Zk51p-.js`
- `static/dist/Index-CD_Axd6t.js`
- `static/dist/Index-CkpnXD9A.js`
- `static/dist/Index-DhdIGc4b.js`
- `static/dist/Index-GTsHbqqJ.js`
- `static/dist/Index-IBzZrYVO.js`
- `static/dist/Index-jYAW6-pL.js`
- `static/dist/Index-lgW7IO_l.js`
- `static/dist/InstructorLayout-CT_0tv52.js`
- `static/dist/InvitationAccept-0cUl56A8.js`
- `static/dist/Landing-CdyN3TU5.js`
- `static/dist/LazyReactPlayer-B07eSLf2.js`
- `static/dist/LectureView-DZNY5WWn.js`
- `static/dist/Login-BHoPptK4.js`
- `static/dist/NewConversation-CICEpTwy.js`
- `static/dist/Operations-F0c2CWTt.js`
- `static/dist/OrderDetail-BGMqotEK.js`
- `static/dist/Orders-DHxm5ypH.js`
- `static/dist/Orders-VlmQw9MH.js`
- `static/dist/PlatformLogo-KRNOkFI-.js`
- `static/dist/Profile-CxQf97n2.js`
- `static/dist/ProgramDetail-BHlCaclu.js`
- `static/dist/ProgramGrid-BaUs2Gkx.js`
- `static/dist/Programs-Cc6peFXb.js`
- `static/dist/ProgramsSection-1BkzJZ3c.js`
- `static/dist/PublicNavbar-BuA7dEO8.js`
- `static/dist/PublicProgramCard-DS_jQAAp.js`
- `static/dist/QuizResultsRenderer-CQfFtamB.js`
- `static/dist/Quizzes-Cpr6pd5F.js`
- `static/dist/Register-DgnpkYTN.js`
- `static/dist/ReportPrint-C82Wn2Ox.js`
- `static/dist/ReportsIndex-CxIz9xEW.js`
- `static/dist/ResetPassword-CMO3DonS.js`
- `static/dist/Results-CI5yeM9P.js`
- `static/dist/Results-DEAxKrTC.js`
- `static/dist/Review-D273uE35.js`
- `static/dist/Reviews-DMLZA_LS.js`
- `static/dist/RichTextEditor-BvV4TbQM.js`
- `static/dist/RichTextEditorImpl-DepCgPw_.js`
- `static/dist/RubricForm-4hAocbiB.js`
- `static/dist/School-CcUYdsB1.js`
- `static/dist/Show-Csd1BD2v.js`
- `static/dist/Show-DjZbA8mS.js`
- `static/dist/Show-DzAnxXuY.js`
- `static/dist/Show-o97kkbQ9.js`
- `static/dist/StudentProgress-DEDj6Evs.js`
- `static/dist/Submissions-yDtqzQje.js`
- `static/dist/Take-BDtKGEbP.js`
- `static/dist/Take-BandLvVy.js`
- `static/dist/Upload-Ddo3ZJgX.js`
- `static/dist/VerifyCertificate-vb6Fvac7.js`
- `static/dist/View-qYYkrpEL.js`
- `static/dist/Wishlist-BiSrnnfI.js`
- `static/dist/Wishlist-avUsPpQb.js`
- `static/dist/index-cnSgysFO.js`
- `static/dist/index-oMfWSUnj.js`
- `static/dist/learningSelection-CQtLtjlW.js`
- `static/dist/main-ClVTBrdQ.js`
- `static/dist/paystackPopup-YlbsDutq.js`
- `static/dist/react-CWv7DFKh.js`
- `static/dist/useCurrency-BJFvixt0.js`
- `static/dist/About-CiQHgtBq.js`
- `static/dist/Assessments-BVomFD77.js`
- `static/dist/Assignments-DzVYpvhx.js`
- `static/dist/Branding-CqXfnnks.js`
- `static/dist/Builder-BLCfLa4d.js`
- `static/dist/Builder-CY5qvewE.js`
- `static/dist/Builder-nd-G8Vl6.js`
- `static/dist/Cart-DDxO7uHy.js`
- `static/dist/CertificateBuilderWorkspace-By5IHspC.js`
- `static/dist/CertificateVerification-BKhdT7bp.js`
- `static/dist/CertificateVerify-DbDRfaQG.js`
- `static/dist/Certificates-yuucaR8x.js`
- `static/dist/Checkout-BRQAfsFU.js`
- `static/dist/Checkout-Bzu7rdN4.js`
- `static/dist/Contact-D2aKuji9.js`
- `static/dist/Conversation-DF52rEsC.js`
- `static/dist/Create-2evt1h2O.js`
- `static/dist/Create-C4jQlkvh.js`
- `static/dist/Create-DHqsLBIl.js`
- `static/dist/Create-DKxXV9Wk.js`
- `static/dist/Create-DNEivTyF.js`
- `static/dist/CurriculumTree-DEDfz2yL.js`
- `static/dist/Dashboard-DPV8CZZ9.js`
- `static/dist/Detail-I3uNVLE-.js`
- `static/dist/Detail-pDUsyjMy.js`
- `static/dist/Detail-xxKZU4KR.js`
- `static/dist/Edit-BPiZ0_fL.js`
- `static/dist/Edit-C5xqxE1q.js`
- `static/dist/EventDetail-CG9FkADB.js`
- `static/dist/Events-CKdk5-C9.js`
- `static/dist/Footer-c3R1P7Rn.js`
- `static/dist/ForgotPassword-S04SEqaA.js`
- `static/dist/Form-BU9NS8Pu.js`
- `static/dist/Form-CSb2BNQ-.js`
- `static/dist/Form-D2-uOmeJ.js`
- `static/dist/Global-BkHuZKXI.js`
- `static/dist/GoogleIdentityScript-IiOkpIzL.js`
- `static/dist/Grade-_YV5QsnJ.js`
- `static/dist/Home-DvL5BLGq.js`
- `static/dist/Inbox-BGuggdxo.js`
- `static/dist/Index-0kHW_8WX.js`
- `static/dist/Index-2_tLCCpP.js`
- `static/dist/Index-B1PW0wCo.js`
- `static/dist/Index-BAyk7xzs.js`
- `static/dist/Index-BZKjBRSx.js`
- `static/dist/Index-BjBMpPDx.js`
- `static/dist/Index-BoAcG0BH.js`
- `static/dist/Index-BuUH6_Z4.js`
- `static/dist/Index-C2oq6n2y.js`
- `static/dist/Index-C6EpaWDy.js`
- `static/dist/Index-C7zxa7Dp.js`
- `static/dist/Index-CIjIiEre.js`
- `static/dist/Index-COapfF5h.js`
- `static/dist/Index-Ck_-349B.js`
- `static/dist/Index-Co23A7br.js`
- `static/dist/Index-Co9TRD-q.js`
- `static/dist/Index-DJ3cy7--.js`
- `static/dist/Index-DKwBS0Q6.js`
- `static/dist/Index-DVZXHEce.js`
- `static/dist/Index-Dgb4YvIJ.js`
- `static/dist/Index-R45GVVs9.js`
- `static/dist/Index-zwEMZXsZ.js`
- `static/dist/InstructorLayout-B1V-svsb.js`
- `static/dist/InvitationAccept-9_oqSF4n.js`
- `static/dist/Landing-DAitqDeQ.js`
- `static/dist/LazyReactPlayer-DmxqVuSQ.js`
- `static/dist/LectureView-CyLG6zXN.js`
- `static/dist/Login-uXYR98y3.js`
- `static/dist/NavigateNext-C7EBh0S3.js`
- `static/dist/NewConversation-CjfyQ8uj.js`
- `static/dist/Operations-Z4GecfGP.js`
- `static/dist/OrderDetail-DbVl_59L.js`
- `static/dist/Orders-DB2wPoG4.js`
- `static/dist/Orders-DQ3U8AmR.js`
- `static/dist/PaymentPending-Cc0wWNRF.js`
- `static/dist/PlatformLogo-kogSl7ng.js`
- `static/dist/Profile-BMOkLxNw.js`
- `static/dist/ProgramDetail-Cepfwa27.js`
- `static/dist/ProgramGrid-CoQG7YmA.js`
- `static/dist/Programs-DjWXouLy.js`
- `static/dist/ProgramsSection-DiE_3_Lq.js`
- `static/dist/PublicNavbar-Cxiwh9AB.js`
- `static/dist/PublicProgramCard-iFF0y_0n.js`
- `static/dist/QuizResultsRenderer-_pQYr2JI.js`
- `static/dist/Quizzes-De4MH9LS.js`
- `static/dist/Register-EEppJUNa.js`
- `static/dist/ReportPrint-9-1Stw7F.js`
- `static/dist/ReportsIndex-BfZR9cal.js`
- `static/dist/ResetPassword-DsX7fdE4.js`
- `static/dist/Results-BUBn-cCl.js`
- `static/dist/Results-CYw0x7rz.js`
- `static/dist/Review-RNoPc1PR.js`
- `static/dist/Reviews-DzNwtpZV.js`
- `static/dist/RichTextEditor-BODkUPc2.js`
- `static/dist/RichTextEditorImpl-jIEBOAx4.js`
- `static/dist/RubricForm-CzHfJkAa.js`
- `static/dist/Show-BSKQjYk3.js`
- `static/dist/Show-BYiA4mCQ.js`
- `static/dist/Show-BerWFdaP.js`
- `static/dist/Show-DUNCZbTk.js`
- `static/dist/StudentProgress-DWKiPs86.js`
- `static/dist/Submissions-BfCraBit.js`
- `static/dist/Take-DPwb8x1B.js`
- `static/dist/Take-DiImpykU.js`
- `static/dist/Upload-403tE34l.js`
- `static/dist/VerifyCertificate-loV32WIz.js`
- `static/dist/View-zeeD66-D.js`
- `static/dist/Wishlist-BHi8awRG.js`
- `static/dist/Wishlist-Bkxk5Mrs.js`
- `static/dist/index-B55BEfVy.js`
- `static/dist/index-C98hzwmK.js`
- `static/dist/learningSelection-By3QyS-b.js`
- `static/dist/main-CgxoTMph.js`
- `static/dist/react-CwocvrK7.js`
- `static/dist/useCurrency-CJ1AkVL3.js`
