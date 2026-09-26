import axios from "axios";

const BASE = "/assessments/question-library";

const withoutEmpty = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== "",
        ),
    );

export const errorMessage = (error, fallback = "Something went wrong. Try again.") =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    fallback;

const data = (request) => request.then((response) => response.data);

export const listBanks = (params) =>
    data(axios.get(`${BASE}/banks/`, { params: withoutEmpty(params) }));

export const createBank = (payload) => data(axios.post(`${BASE}/banks/`, payload));

export const updateBank = (bankId, payload) =>
    data(axios.patch(`${BASE}/banks/${bankId}/`, payload));

export const deleteBank = (bankId) => data(axios.delete(`${BASE}/banks/${bankId}/`));

export const promoteBank = (bankId) =>
    data(axios.post(`${BASE}/banks/${bankId}/promote/`));

export const listEntries = (params) =>
    data(axios.get(`${BASE}/entries/`, { params: withoutEmpty(params) }));

export const getEntry = (entryId) => data(axios.get(`${BASE}/entries/${entryId}/`));

export const createEntry = (payload) => data(axios.post(`${BASE}/entries/`, payload));

export const updateEntry = (entryId, payload) =>
    data(axios.patch(`${BASE}/entries/${entryId}/`, payload));

export const deleteEntry = (entryId) =>
    data(axios.delete(`${BASE}/entries/${entryId}/`));

export const addEntryToQuiz = (entryId, quizId) =>
    data(axios.post(`${BASE}/entries/${entryId}/add-to-quiz/`, { quiz_id: quizId }));

export const getCategories = (params) =>
    data(axios.get(`${BASE}/categories/`, { params: withoutEmpty(params) })).then(
        (body) => body.categories || [],
    );

export const getStats = (params) =>
    data(axios.get(`${BASE}/stats/`, { params: withoutEmpty(params) }));
