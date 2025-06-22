import React, { useState, useEffect, useRef } from 'react';
import { useGetTest } from '@/hooks';
import { Button, Checkbox, Form, Input, Radio,
  Select, Typography, Modal, Progress, message } from 'antd';
import { ClockCircleOutlined, CloseOutlined  } from '@ant-design/icons';
import axios from 'axios';
import { UserTestAnswers } from '@/routes/types';
import { useNavigate, useParams } from 'react-router-dom';


export const TestDetailPage = () => {
  const { id: testId } = useParams();
  const { testData, isLoading } = useGetTest();
  const [form] = Form.useForm();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Record<string, string[]>>({});
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  // Инициализация времени при загрузке теста
  useEffect(() => {
    if (testData?.timeLimit) {
      setTimeLeft(testData.timeLimit * 60);
    }
  }, [testData]);

  // Таймер
  useEffect(() => {
    if (!isTestStarted || isTestFinished) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTestStarted, isTestFinished]);

  const handleStartTest = () => {
    setIsTestStarted(true);
  };

  const handleCancelTest = () => {
    Modal.confirm({
      title: 'Отменить тест?',
      content: 'Вы уверены, что хотите отменить тест? Весь прогресс будет потерян.',
      okText: 'Да, отменить',
      cancelText: 'Нет, продолжить',
      onOk: () => navigate('/tests'),
    });
  };

  const handleTimeExpired = async () => {
    clearInterval(timerRef.current);
    setIsTestFinished(true);
    await submitAnswers();
  };

  const submitAnswers = async () => {
    if (!testData?._id) {
      console.error("Test data is not available");
      return;
    }

    // Собираем все ответы, включая текущий вопрос
    const currentValues = form.getFieldsValue().answers || {};
    const finalAnswers = { ...allAnswers, ...currentValues };
    const timeTaken = testData?.timeLimit * 60 - timeLeft;

    const payload: UserTestAnswers = {
      answers: Object.entries(finalAnswers).map(([questionId, givenAnswer]) => ({
        questionId,
        givenAnswer: Array.isArray(givenAnswer) ? givenAnswer : [givenAnswer],
      })),
    };
    console.log('payload', payload)
    try {
      await axios.post(`/api/tests/${testData._id}/answer`, {
        timeTaken,
        payload
      });
      message.success('Тест успешно завершен!');
      navigate(`/tests/`);
    } catch (error) {
      console.error('Ошибка при отправке теста:', error);
      message.error('Произошла ошибка при отправке теста');
    }
  };

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      setAllAnswers((prev) => ({
        ...prev,
        ...values.answers,
      }));

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        form.resetFields();
      }
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => prev - 1);
    form.resetFields();
  };

  const handleFinishTest = async () => {
    try {
      const values = await form.validateFields();
      setAllAnswers((prev) => ({
        ...prev,
        ...values.answers,
      }));
      setIsTestFinished(true);
      await submitAnswers();
      navigate('/tests/')
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!testData) {
    return <div>Test data is not available</div>;
  }

  const questions = testData?.questions || [];
  const isLastQuestion = currentIndex === questions.length - 1;
  const question = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {!isTestStarted && (
        <Modal
          title="Начало теста"
          open={!isTestStarted}
          footer={null}
          closable={true}
          closeIcon={<CloseOutlined />}
          onCancel={handleCancelTest}
        >
          <Typography.Title level={4}>{testData?.name}</Typography.Title>
          <p>{testData?.description}</p>
          <p>Время на тест: {testData?.timeLimit} минут</p>
          <p>Количество вопросов: {questions.length}</p>
          <Button
            type="primary"
            icon={<ClockCircleOutlined />}
            onClick={handleStartTest}
            style={{ marginTop: 16 }}
          >
            Начать тест
          </Button>
        </Modal>
      )}

      {isTestStarted && !isTestFinished && (
        <>
          <Typography.Title level={1}>{testData?.name}</Typography.Title>

          <div style={{ marginBottom: 20 }}>
            <Progress
              percent={((testData.timeLimit * 60 - timeLeft)
                / (testData.timeLimit * 60) * 100)}
              size="small"
              status="active"
              strokeColor="green"
              format={() => formatTime(timeLeft)}
            />
          </div>

          <Form form={form} initialValues={{ answers: allAnswers }}>
            <Typography.Title level={4}>
              Вопрос {currentIndex + 1} из {questions.length}
            </Typography.Title>
            <Typography.Paragraph strong>{question?.question}</Typography.Paragraph>
            <Typography.Paragraph strong>{question?.description}</Typography.Paragraph>

            {question?.controlType === 'checkbox' && (
              <Form.Item
                key={question._id}
                name={['answers', question._id]}
                rules={[{ required: true,
                  message: 'Пожалуйста, выберите хотя бы один вариант' }]}
              >
                <Checkbox.Group>
                  {question.options.map((option) => (
                    <Checkbox key={option} value={option}>
                      {option}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>
            )}

            {question?.controlType === 'select' && (
              <Form.Item
                name={['answers', question._id]}
                rules={[{ required: true,
                  message: 'Пожалуйста, выберите вариант' }]}
              >
                <Select options={question.options.map((item) =>
                  ({ label: item, value: item }))} />
              </Form.Item>
            )}

            {question?.controlType === 'input' && (
              <Form.Item
                name={['answers', question._id]}
                rules={[{ required: true, message: 'Пожалуйста, введите ответ' }]}
              >
                <Input />
              </Form.Item>
            )}

            {question?.controlType === 'radio' && (
              <Form.Item
                name={['answers', question._id]}
                rules={[{ required: true, message: 'Пожалуйста, выберите вариант' }]}
              >
                <Radio.Group>
                  {question.options.map((option) => (
                    <Radio key={option} value={option}>
                      {option}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            )}

            <div style={{ marginTop: 20 }}>
              {currentIndex > 0 && (
                <Button onClick={handlePrevious}>Назад</Button>
              )}
              {isLastQuestion ? (
                <Button
                  type="primary"
                  onClick={handleFinishTest}
                  style={{ marginLeft: 10 }}
                >
                  Завершить тест
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleNext}
                  style={{ marginLeft: 10 }}
                >
                  Следующий вопрос
                </Button>
              )}
            </div>
          </Form>
        </>
      )}
    </>
  );
};
