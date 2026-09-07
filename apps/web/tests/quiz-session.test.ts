import assert from 'node:assert/strict';
import test from 'node:test';
import { correctAnswer,queueRetry, type QuizEntry } from '../src/domain/quiz-session.ts';
import { estimateLevel,proposeRoadmap,diagnosticQuestions } from '../src/domain/onboarding.ts';
test('grading allows punctuation but preserves inflections and synonyms',()=>{assert.equal(correctAnswer('elephants','Elephants!'),true);assert.equal(correctAnswer('elephants','elephant'),false);assert.equal(correctAnswer('ended up','end up'),false);assert.equal(correctAnswer("I'm down",'I am down'),true);assert.equal(correctAnswer("I'm down",'Sounds good'),false)});
test('retry preserves format and inserts at least two intervening questions',()=>{const q:QuizEntry[]=[{phraseId:'phrase-3',format:'typing',retryIndex:0}];const result=queueRetry(q,0,()=>0);assert.equal(result[3]?.phraseId,'phrase-3');assert.equal(result[3]?.format,'typing');assert.equal(result[3]?.retryIndex,1);assert.equal(result[1]?.filler,true)});
test('second retry does not schedule a third retry',()=>{const q:QuizEntry[]=[{phraseId:'phrase-4',format:'reorder',retryIndex:2}];assert.deepEqual(queueRetry(q,0),q)});
test('diagnostic has required 8 vocabulary, 5 grammar, 5 listening items',()=>{assert.equal(diagnosticQuestions.length,18);assert.equal(diagnosticQuestions.filter(q=>q.kind==='リスニング').length,5);assert.equal(estimateLevel(18,18),'B1');assert.equal(estimateLevel(0,18),'A1')});
test('plans are uncompleted proposals and reflect travel context',()=>{const plan=proposeRoadmap('旅行でカフェに行きたい',[]);assert.ok(plan.some(p=>p.title.includes('カフェ')));assert.ok(plan.every(p=>!p.completed))});
