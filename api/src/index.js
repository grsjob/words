/** @format */

const express = require('express');


const bodyParser = require('body-parser');

// const cors = require('cors');
const { connectDb } = require('./helpers/db');
const { port, db } = require('./configuration');
const router = require('./router/index');
const cookieParser = require('cookie-parser');
const errorsMiddleware = require('./middlewares/errors');
const authMiddleware = require('./middlewares/auth');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
// app.use(cors())
app.use(authMiddleware);
app.use(router);
app.use(errorsMiddleware);

const PORT = port || 3001;

const startServer = async () => {
  try {
    app.listen(PORT, async () => {
      console.log(`Service api started on port:  ${PORT}`);
      console.log(`DataBase ${db}`);
    });
  } catch (e) {
    console.error(e);
  }

};


// export {testsArray, users};
//
// startServer();

// app.get("/tests", (req, res) => { // вывод всех тестов
//   res.json(testsArray);
// });
//
// app.get("/tests/:testId", (req, res) => { // выыод теста по id
//   const testId = req.params.testId;
//   const findTest = testsArray.find((test) => test.id === testId);
//
//   for (let option of findTest.questions) {
//     delete option.answer;
//   }
//   res.json(findTest);
// });
//
// app.get("/tests/results/:testId", (req, res) => {   // Вывод определенного теста по id
//   const testId = req.params.testId;
//   const findUser = users.find((user) => user.userId === req.body.userId);
//   const findTest = findUser.passedTests.find((test) => test.testId === testId);
//
//   if (!findUser){
//     res.json("Нет такого пользовтеля");
//   } else {
//     if (!findTest){
//       res.json(`Нет такого теста у пользователя ${findUser.userName}`);
//     } else {
//       res.json(findTest)
//     }
//   }
// });
//
// app.post("/tests/:testId", (req, res) => { // Добавление теста
//   req.body.id = req.params.testId;
//   testsArray.push(req.body);
//   res.send('Тест добавлен.')
// });
//
// app.post("/tests/:testId/answer", (req, res) => { // Обработка ответов (сравнение) теста
//   console.log(req.body);
//   const { userId, ...answers } = req.body;
//   const testId = req.params.testId;
//   const currentTest = testsArray.find((item) => item.id === testId);
//
//   const result = currentTest.questions.reduce((res, cur) => {
//     if (answers[cur.questionID] === cur.answer) {
//       res[cur.questionID] = true;
//     } else {
//       res[cur.questionID] = false;
//     }
//     return res;
//   }, {});
//
//   users = users.map((user) => {
//     if (user.userId === userId) {
//       const newPassedTest = user.passedTests.map((item) => {
//         if (item.testId === testId) {
//           return { testId, answers: result };
//         } else {
//           return item;
//         }
//       });
//
//       return { ...user, passedTests: newPassedTest };
//     } else {
//       return user;
//     }
//   });
//
//   res.send(result);
// });
//
// app.delete("/tests/:testId", (req, res) => {
//   const testId = req.params.testId;
//   testsArray.forEach((test,index) => {
//     if (test.id === testId) {
//       res.json(`Тест ${test.name} удалён`);
//       testsArray.splice(index,1)
//     }
//   });
// });

connectDb()
  .on('error', console.log)
  .on('disconnect', connectDb)
  .once('open', startServer);
