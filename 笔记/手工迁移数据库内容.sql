-- 测试做坏了的数据库结构，修复不了就迁移数据

INSERT into  Ebooks select * from old.Ebooks;
INSERT into  EbookChapters select * from old.EbookChapters;
INSERT into  WebBooks select * from old.WebBooks;
INSERT into  WebBookChapters select * from old.WebBookChapters;
INSERT into  WebBookIndexSourceURLs select * from old.WebBookIndexSourceURLs;
INSERT into  PDFBooks select * from old.PDFBooks;
INSERT into  SystemConfigs select * from old.SystemConfigs;
INSERT into  ReviewRules select * from old.ReviewRules;
INSERT into  ReviewRuleUsings select * from old.ReviewRuleUsings;
INSERT into  RuleForWebs(id,RuleName,Selector,RemoveSelector,GetContentAction,GetUrlAction,Type,CheckSetting,Host,createdAt,updatedAt)
select id,RuleName,Selector,RemoveSelector,GetContentAction,GetUrlAction,Type,CheckSetting,Host,createdAt,updatedAt from old.RuleForWebs;

INSERT into  WebBookIndexURLs( id,Path,createdAt,updatedAt,WebBookIndexId )
 select b.id,b.Path,b.createdAt,b.updatedAt,b.WebBookIndexId from old.WebBookIndexURLs b
 INNER JOIN old.WebBookChapters a on a.id = b.WebBookIndexId
 

