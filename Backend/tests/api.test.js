import request from 'supertest';
import app from '../Server.js';

describe('SubmitEase Backend API Validation Tests', () => {

  it('POST /send-verification should return 400 if email is missing', async () => {
    // Simulating a frontend request that forgot to include the email
    const response = await request(app)
      .post('/send-verification')
      .send({ firstname: 'Aaditya' }); 

    // Asserting that your server caught the error and didn't crash
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Email is required');
  });

  it('POST /upload should return 400 if no PDF file is attached', async () => {
    // Simulating an upload request with no file attached
    const response = await request(app)
      .post('/upload'); 

    // Asserting your Multer middleware caught the missing file
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('No file was uploaded.');
  });

  it('POST /conference/assign-publication-chairs should return 400 for missing array', async () => {
    // Simulating a request that provides an ID, but forgets the userIds array
    const response = await request(app)
      .post('/conference/assign-publication-chairs')
      .send({ conferenceId: 1 }); 

    // Asserting your API validation logic worked
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/conferenceId and userIds array are required/i);
  });

});