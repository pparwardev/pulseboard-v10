--
-- PostgreSQL database dump
--

\restrict XdGsN9C5B6ySa9SQAjMX4SQPyHsMLAOAyFJavKXpm9mEbgcZp15hbLOtn8I7qc5

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pulseboard_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO pulseboard_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pulseboard_admin
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: file_uploads; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.file_uploads (
    id integer NOT NULL,
    user_id integer NOT NULL,
    filename character varying NOT NULL,
    original_filename character varying NOT NULL,
    file_path character varying NOT NULL,
    file_size bigint NOT NULL,
    file_type character varying NOT NULL,
    metric_code character varying,
    week_label character varying,
    uploaded_at timestamp without time zone
);


ALTER TABLE public.file_uploads OWNER TO pulseboard_admin;

--
-- Name: file_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.file_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.file_uploads_id_seq OWNER TO pulseboard_admin;

--
-- Name: file_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.file_uploads_id_seq OWNED BY public.file_uploads.id;


--
-- Name: leave_submissions; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.leave_submissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    leave_date date NOT NULL,
    leave_type character varying(50),
    reason character varying(500),
    is_delivered boolean,
    is_viewed boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.leave_submissions OWNER TO pulseboard_admin;

--
-- Name: leave_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.leave_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_submissions_id_seq OWNER TO pulseboard_admin;

--
-- Name: leave_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.leave_submissions_id_seq OWNED BY public.leave_submissions.id;


--
-- Name: member_performance_metrics; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.member_performance_metrics (
    id integer NOT NULL,
    member_id integer,
    metric_code character varying(50) NOT NULL,
    metric_value double precision,
    normalized_score double precision,
    week_number integer,
    month_number integer,
    year integer,
    period_start date,
    period_end date,
    source_file character varying(500),
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    raw_data json
);


ALTER TABLE public.member_performance_metrics OWNER TO pulseboard_admin;

--
-- Name: member_performance_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.member_performance_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.member_performance_metrics_id_seq OWNER TO pulseboard_admin;

--
-- Name: member_performance_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.member_performance_metrics_id_seq OWNED BY public.member_performance_metrics.id;


--
-- Name: metric_files; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.metric_files (
    id integer NOT NULL,
    user_id integer NOT NULL,
    metric_code character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    processed boolean,
    uploaded_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);


ALTER TABLE public.metric_files OWNER TO pulseboard_admin;

--
-- Name: metric_files_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.metric_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metric_files_id_seq OWNER TO pulseboard_admin;

--
-- Name: metric_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.metric_files_id_seq OWNED BY public.metric_files.id;


--
-- Name: metric_goals; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.metric_goals (
    id integer NOT NULL,
    metric_name character varying(100) NOT NULL,
    metric_code character varying(50) NOT NULL,
    goal_value double precision NOT NULL,
    green_threshold double precision,
    yellow_threshold double precision,
    red_threshold double precision,
    goal_direction character varying(50) DEFAULT 'higher_is_better'::character varying,
    weight double precision DEFAULT 25,
    unit character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_higher_better boolean DEFAULT true,
    description text
);


ALTER TABLE public.metric_goals OWNER TO pulseboard_admin;

--
-- Name: metric_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.metric_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metric_goals_id_seq OWNER TO pulseboard_admin;

--
-- Name: metric_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.metric_goals_id_seq OWNED BY public.metric_goals.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) NOT NULL,
    is_read boolean,
    user_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO pulseboard_admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO pulseboard_admin;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: ot_submissions; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.ot_submissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    date date NOT NULL,
    start_time character varying(10) NOT NULL,
    end_time character varying(10) NOT NULL,
    hours double precision NOT NULL,
    ot_type character varying(10),
    reason character varying(500),
    status character varying(20),
    rejection_reason character varying(500),
    is_delivered boolean,
    is_viewed boolean,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone
);


ALTER TABLE public.ot_submissions OWNER TO pulseboard_admin;

--
-- Name: ot_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.ot_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ot_submissions_id_seq OWNER TO pulseboard_admin;

--
-- Name: ot_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.ot_submissions_id_seq OWNED BY public.ot_submissions.id;


--
-- Name: poll_options; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.poll_options (
    id integer NOT NULL,
    poll_id integer NOT NULL,
    option_text character varying(500) NOT NULL
);


ALTER TABLE public.poll_options OWNER TO pulseboard_admin;

--
-- Name: poll_options_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.poll_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_options_id_seq OWNER TO pulseboard_admin;

--
-- Name: poll_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.poll_options_id_seq OWNED BY public.poll_options.id;


--
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.poll_votes (
    id integer NOT NULL,
    poll_id integer NOT NULL,
    option_id integer NOT NULL,
    user_id integer NOT NULL,
    voted_at timestamp without time zone
);


ALTER TABLE public.poll_votes OWNER TO pulseboard_admin;

--
-- Name: poll_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.poll_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_votes_id_seq OWNER TO pulseboard_admin;

--
-- Name: poll_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.poll_votes_id_seq OWNED BY public.poll_votes.id;


--
-- Name: polls; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.polls (
    id integer NOT NULL,
    question text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone,
    is_active boolean
);


ALTER TABLE public.polls OWNER TO pulseboard_admin;

--
-- Name: polls_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.polls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.polls_id_seq OWNER TO pulseboard_admin;

--
-- Name: polls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.polls_id_seq OWNED BY public.polls.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    skill_code character varying(255) NOT NULL,
    team_name character varying(100),
    is_active boolean
);


ALTER TABLE public.skills OWNER TO pulseboard_admin;

--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skills_id_seq OWNER TO pulseboard_admin;

--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.team_members (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    user_id integer,
    role character varying(100),
    join_date date,
    shift_start time without time zone,
    shift_end time without time zone,
    photo_url character varying(500),
    phone character varying(20),
    level character varying(10),
    country character varying(100),
    country_code character varying(10),
    supports_marketplace character varying(50),
    skillset character varying(500),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.team_members OWNER TO pulseboard_admin;

--
-- Name: team_members_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.team_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_members_id_seq OWNER TO pulseboard_admin;

--
-- Name: team_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.team_members_id_seq OWNED BY public.team_members.id;


--
-- Name: upcoming_leaves; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.upcoming_leaves (
    id integer NOT NULL,
    user_id integer NOT NULL,
    leave_date date NOT NULL,
    end_date date,
    leave_type character varying(50),
    reason character varying(500),
    is_announced boolean,
    is_processed boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.upcoming_leaves OWNER TO pulseboard_admin;

--
-- Name: upcoming_leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.upcoming_leaves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.upcoming_leaves_id_seq OWNER TO pulseboard_admin;

--
-- Name: upcoming_leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.upcoming_leaves_id_seq OWNED BY public.upcoming_leaves.id;


--
-- Name: user_skills; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.user_skills (
    id integer NOT NULL,
    user_id integer NOT NULL,
    skill_id integer NOT NULL
);


ALTER TABLE public.user_skills OWNER TO pulseboard_admin;

--
-- Name: user_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.user_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_skills_id_seq OWNER TO pulseboard_admin;

--
-- Name: user_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.user_skills_id_seq OWNED BY public.user_skills.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    previous_password character varying(255),
    employee_id character varying(50) NOT NULL,
    marketplace character varying(10),
    contact_number character varying(20),
    level character varying(10),
    manager_login character varying(100),
    team_name character varying(100),
    location character varying(100),
    supports_marketplace character varying(50),
    skill_set character varying(100),
    role character varying(50) NOT NULL,
    profile_picture character varying(500),
    date_of_birth character varying(10),
    shift_start character varying(10),
    shift_end character varying(10),
    week_off character varying(20),
    is_email_verified boolean,
    is_active boolean,
    is_approved boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_tenure character varying(100)
);


ALTER TABLE public.users OWNER TO pulseboard_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO pulseboard_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wall_comments; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.wall_comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.wall_comments OWNER TO pulseboard_admin;

--
-- Name: wall_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.wall_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wall_comments_id_seq OWNER TO pulseboard_admin;

--
-- Name: wall_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.wall_comments_id_seq OWNED BY public.wall_comments.id;


--
-- Name: wall_posts; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.wall_posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_type character varying(50),
    content text NOT NULL,
    emoji character varying(10),
    gif_url character varying(500),
    badge character varying(50),
    recipient_ids character varying(500),
    leadership_principles character varying(500),
    week_number integer,
    year integer,
    image_url text,
    is_pinned boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.wall_posts OWNER TO pulseboard_admin;

--
-- Name: wall_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.wall_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wall_posts_id_seq OWNER TO pulseboard_admin;

--
-- Name: wall_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.wall_posts_id_seq OWNED BY public.wall_posts.id;


--
-- Name: wall_reactions; Type: TABLE; Schema: public; Owner: pulseboard_admin
--

CREATE TABLE public.wall_reactions (
    id integer NOT NULL,
    post_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction character varying(10),
    created_at timestamp without time zone
);


ALTER TABLE public.wall_reactions OWNER TO pulseboard_admin;

--
-- Name: wall_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: pulseboard_admin
--

CREATE SEQUENCE public.wall_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wall_reactions_id_seq OWNER TO pulseboard_admin;

--
-- Name: wall_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pulseboard_admin
--

ALTER SEQUENCE public.wall_reactions_id_seq OWNED BY public.wall_reactions.id;


--
-- Name: file_uploads id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.file_uploads ALTER COLUMN id SET DEFAULT nextval('public.file_uploads_id_seq'::regclass);


--
-- Name: leave_submissions id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.leave_submissions ALTER COLUMN id SET DEFAULT nextval('public.leave_submissions_id_seq'::regclass);


--
-- Name: member_performance_metrics id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.member_performance_metrics ALTER COLUMN id SET DEFAULT nextval('public.member_performance_metrics_id_seq'::regclass);


--
-- Name: metric_files id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.metric_files ALTER COLUMN id SET DEFAULT nextval('public.metric_files_id_seq'::regclass);


--
-- Name: metric_goals id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.metric_goals ALTER COLUMN id SET DEFAULT nextval('public.metric_goals_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: ot_submissions id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.ot_submissions ALTER COLUMN id SET DEFAULT nextval('public.ot_submissions_id_seq'::regclass);


--
-- Name: poll_options id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_options ALTER COLUMN id SET DEFAULT nextval('public.poll_options_id_seq'::regclass);


--
-- Name: poll_votes id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_votes ALTER COLUMN id SET DEFAULT nextval('public.poll_votes_id_seq'::regclass);


--
-- Name: polls id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.polls ALTER COLUMN id SET DEFAULT nextval('public.polls_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: team_members id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.team_members ALTER COLUMN id SET DEFAULT nextval('public.team_members_id_seq'::regclass);


--
-- Name: upcoming_leaves id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.upcoming_leaves ALTER COLUMN id SET DEFAULT nextval('public.upcoming_leaves_id_seq'::regclass);


--
-- Name: user_skills id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.user_skills ALTER COLUMN id SET DEFAULT nextval('public.user_skills_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wall_comments id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_comments ALTER COLUMN id SET DEFAULT nextval('public.wall_comments_id_seq'::regclass);


--
-- Name: wall_posts id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_posts ALTER COLUMN id SET DEFAULT nextval('public.wall_posts_id_seq'::regclass);


--
-- Name: wall_reactions id; Type: DEFAULT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_reactions ALTER COLUMN id SET DEFAULT nextval('public.wall_reactions_id_seq'::regclass);


--
-- Data for Name: file_uploads; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.file_uploads (id, user_id, filename, original_filename, file_path, file_size, file_type, metric_code, week_label, uploaded_at) FROM stdin;
9	1	1_QA_20260312_105148_Team_Member_LESC.csv	Team_Member_LESC.csv	uploads/file_manager/1_QA_20260312_105148_Team_Member_LESC.csv	2291	application/vnd.ms-excel	QA	Week 11 - 2026	2026-03-12 10:51:48.798031
10	1	1_ACHT_20260417_044451_Week 13 ACHT.xlsx	Week 13 ACHT.xlsx	uploads/file_manager/1_ACHT_20260417_044451_Week 13 ACHT.xlsx	57649	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	ACHT	Week 13 - 2026	2026-04-17 04:44:51.801676
12	1	1_Missed_20260417_120133_Missed_Contacts_by_W_1776426559419.xlsx	Missed_Contacts_by_W_1776426559419.xlsx	uploads/file_manager/1_Missed_20260417_120133_Missed_Contacts_by_W_1776426559419.xlsx	20761	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	Missed	Week 16 - 2026	2026-04-17 12:01:33.806115
\.


--
-- Data for Name: leave_submissions; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.leave_submissions (id, user_id, leave_date, leave_type, reason, is_delivered, is_viewed, created_at) FROM stdin;
1	16	2026-02-28	Casual Leave	Scheduled leave	t	f	2026-02-28 07:04:14.787313+00
2	14	2026-03-02	Sick Leave		t	t	2026-03-09 23:15:14.234122+00
3	14	2026-03-05	Annual Leave		t	t	2026-02-24 04:53:52.736167+00
4	14	2026-03-12	Casual Leave		t	t	2026-02-24 04:56:00.671633+00
5	14	2026-03-05	Annual Leave	Scheduled leave	t	t	2026-03-05 04:18:04.574068+00
6	14	2026-03-06	Sick Leave	Fever	t	t	2026-03-08 11:50:08.176205+00
7	14	2026-03-09	Sick Leave		f	f	2026-03-09 23:19:47.067246+00
8	14	2026-03-25	Annual Leave	vacation	f	f	2026-03-09 23:20:13.349479+00
9	14	2026-03-11	Sick Leave	Out sick	f	f	2026-03-11 05:35:20.379041+00
10	12	2026-03-11	Sick Leave		f	f	2026-03-11 08:05:01.160324+00
11	12	2026-03-11	Sick Leave		f	f	2026-03-11 08:05:04.8446+00
12	16	2026-03-11	Casual Leave		f	f	2026-03-11 08:06:17.108565+00
13	14	2026-03-11	Sick Leave	Out sick	t	f	2026-03-11 08:34:14.453403+00
14	12	2026-03-11	Sick Leave	Scheduled leave	t	f	2026-03-11 08:34:14.453403+00
15	16	2026-03-11	Casual Leave	Scheduled leave	t	f	2026-03-11 08:34:14.453403+00
16	14	2026-03-11	Sick Leave		f	f	2026-03-11 10:46:55.279472+00
17	16	2026-02-16	Annual Leave	vacation	t	t	2026-02-24 02:59:34.988696+00
18	16	2026-02-28	Casual Leave		t	t	2026-02-24 02:59:55.815363+00
19	14	2026-03-11	Sick Leave	Scheduled leave	t	f	2026-03-11 12:03:54.385552+00
20	14	2026-04-28	Annual Leave	vacation	t	t	2026-03-02 06:40:01.496689+00
21	16	2026-03-12	Casual Leave		t	f	2026-02-24 05:48:09.332096+00
22	14	2026-02-25	Casual Leave	vacation	t	t	2026-02-25 04:04:14.750435+00
23	14	2026-02-25	Annual Leave	vacation	t	t	2026-02-25 04:04:14.750435+00
24	14	2026-02-25	Annual Leave	vacation	t	t	2026-02-25 04:04:14.750435+00
25	14	2026-02-26	Sick Leave	Scheduled leave	t	t	2026-02-26 05:04:14.621164+00
26	14	2026-02-25	Annual Leave	vacation	t	t	2026-02-23 10:27:56.658034+00
27	14	2026-02-18	Casual Leave	casual	t	t	2026-02-23 10:41:38.871258+00
28	14	2026-02-18	Sick Leave	sick	t	t	2026-02-18 07:50:56.918099+00
29	14	2026-02-19	Sick Leave	Sick	t	t	2026-02-18 07:51:20.924733+00
30	14	2026-02-19	Sick Leave	Sick	t	t	2026-02-19 07:05:39.604105+00
31	14	2026-02-20	Annual Leave	Vacationing	t	t	2026-02-19 10:50:41.116494+00
32	14	2026-02-20	Annual Leave	Vacationing	t	t	2026-02-20 12:28:26.184018+00
33	14	2026-02-24	Annual Leave	vacation	t	t	2026-02-23 09:06:54.755722+00
34	14	2026-02-18	Sick Leave	sick	t	t	2026-02-23 09:53:47.39339+00
35	14	2026-02-25	Casual Leave	vacation	t	t	2026-02-23 09:55:07.03662+00
36	14	2026-02-12	Sick Leave	sick	t	t	2026-02-23 10:25:10.684502+00
37	14	2026-02-25	Annual Leave	vacation	t	t	2026-02-23 10:43:59.918805+00
38	14	2026-02-26	Sick Leave		t	t	2026-02-24 04:42:32.506176+00
39	14	2026-02-24	Annual Leave	vacation	t	t	2026-02-24 04:47:39.09384+00
40	14	2026-02-11	Annual Leave		t	t	2026-02-24 07:08:25.89681+00
41	14	2026-03-17	casual		f	f	2026-03-12 11:49:51.700102+00
\.


--
-- Data for Name: member_performance_metrics; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.member_performance_metrics (id, member_id, metric_code, metric_value, normalized_score, week_number, month_number, year, period_start, period_end, source_file, uploaded_at, created_at, raw_data) FROM stdin;
1	2	ROR	2.56	91.72	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:08.979401+00	\N
2	2	QA	100.5	79.89	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.004153+00	\N
3	2	ACHT	16.31	62.34	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.00632+00	\N
5	3	ROR	2.59	78.86	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.011643+00	\N
6	3	QA	84.29	89.91	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.019584+00	\N
7	3	ACHT	21.6	88.91	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.021373+00	\N
9	4	ROR	2.74	61.27	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.024876+00	\N
10	4	QA	73.57	79.39	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.026516+00	\N
11	4	ACHT	17.03	61.48	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.028107+00	\N
13	6	ROR	2.87	79.22	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.031163+00	\N
14	6	QA	114	96.43	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.041192+00	\N
15	6	ACHT	14.72	71.82	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.044111+00	\N
17	7	ROR	2.03	98.94	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.055082+00	\N
18	7	QA	117.84	79.21	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.056661+00	\N
19	7	ACHT	15.68	63.63	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.058135+00	\N
21	8	ROR	2.69	85.53	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.061152+00	\N
22	8	QA	116.87	92.44	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.064177+00	\N
23	8	ACHT	14.02	86.02	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.066273+00	\N
25	9	ROR	2.29	98.53	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.072799+00	\N
26	9	QA	80.2	61.58	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.074707+00	\N
27	9	ACHT	12.32	61.5	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.081098+00	\N
29	10	ROR	2.38	67.18	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.088108+00	\N
30	10	QA	114.33	90.87	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.089799+00	\N
31	10	ACHT	20.56	92.12	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.091353+00	\N
33	11	ROR	1.59	63.43	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.102545+00	\N
34	11	QA	107.27	78.04	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.104467+00	\N
35	11	ACHT	21.16	86.93	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.106077+00	\N
37	12	ROR	1.59	83.56	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.111625+00	\N
38	12	QA	115.54	64.27	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.123144+00	\N
39	12	ACHT	19.75	91.24	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.125094+00	\N
41	13	ROR	2.09	92.68	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.134168+00	\N
42	13	QA	110.24	68.39	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.136479+00	\N
43	13	ACHT	25.72	79.5	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.141264+00	\N
45	14	ROR	2.34	78.98	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.146435+00	\N
46	14	QA	95.78	76.68	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.148832+00	\N
47	14	ACHT	15.42	97.44	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.15859+00	\N
49	15	ROR	1.05	75.02	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.177272+00	\N
50	15	QA	85.57	96.84	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.17942+00	\N
51	15	ACHT	14.31	74.99	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.181668+00	\N
53	16	ROR	1.48	70.54	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.192978+00	\N
54	16	QA	88.76	97.54	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.196613+00	\N
55	16	ACHT	12.11	68.14	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.207202+00	\N
57	17	ROR	2.87	76.6	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.21165+00	\N
58	17	QA	78.34	69.56	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.214698+00	\N
59	17	ACHT	22.29	65.72	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.217117+00	\N
61	18	ROR	2.96	71.8	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.220651+00	\N
62	18	QA	109.98	78.38	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.228315+00	\N
63	18	ACHT	25.33	81.61	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.230144+00	\N
65	19	ROR	2.5	64.42	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.233856+00	\N
66	19	QA	115.08	86.78	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.235457+00	\N
67	19	ACHT	16.37	86.6	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.237087+00	\N
69	20	ROR	1.15	62.39	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.248847+00	\N
70	20	QA	115.54	61.73	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.250922+00	\N
71	20	ACHT	16.06	88.89	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.25283+00	\N
73	21	ROR	1.87	82.75	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.265746+00	\N
74	21	QA	93.31	73.28	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.268158+00	\N
75	21	ACHT	17.79	96.34	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.277537+00	\N
77	22	ROR	2.84	96.4	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.289923+00	\N
78	22	QA	108.5	95.58	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.291973+00	\N
79	22	ACHT	14	80.31	1	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.293993+00	\N
81	2	ROR	1.8	93.75	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.310266+00	\N
82	2	QA	101.46	91.78	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.313104+00	\N
83	2	ACHT	18.13	73.55	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.315133+00	\N
85	3	ROR	1.94	94.03	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.325447+00	\N
86	3	QA	119.05	85.41	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.326734+00	\N
87	3	ACHT	11.67	73.88	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.328269+00	\N
89	4	ROR	2.9	66.48	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.331133+00	\N
90	4	QA	102.73	94.79	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.332744+00	\N
91	4	ACHT	21.91	65.77	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.349563+00	\N
93	6	ROR	2.78	92.27	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.353474+00	\N
94	6	QA	90.95	77.15	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.355307+00	\N
95	6	ACHT	16.12	72.18	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.356994+00	\N
97	7	ROR	2.48	86.01	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.368627+00	\N
98	7	QA	111.95	82.7	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.37012+00	\N
99	7	ACHT	23.75	66.95	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.371566+00	\N
101	8	ROR	1.65	97.82	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.382752+00	\N
102	8	QA	75.67	81.28	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.38438+00	\N
103	8	ACHT	10.96	66.34	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.385747+00	\N
105	9	ROR	2.73	86.23	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.388541+00	\N
106	9	QA	107.5	70.31	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.390096+00	\N
107	9	ACHT	8.85	74.19	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.398655+00	\N
109	10	ROR	2.27	72.66	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.40219+00	\N
110	10	QA	109.99	90.67	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.403738+00	\N
111	10	ACHT	25.58	97.87	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.405117+00	\N
113	11	ROR	2.64	73.1	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.433167+00	\N
114	11	QA	119.3	67.54	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.434937+00	\N
115	11	ACHT	21.58	98.89	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.436548+00	\N
117	12	ROR	1.88	84.04	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.439468+00	\N
118	12	QA	99.09	88.32	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.440891+00	\N
119	12	ACHT	11.39	73.22	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.450391+00	\N
121	13	ROR	1.14	67.62	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.453782+00	\N
122	13	QA	111.39	61.98	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.455254+00	\N
123	13	ACHT	15.33	92.4	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.456614+00	\N
125	14	ROR	2.58	83.43	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.464416+00	\N
126	14	QA	86.43	79.94	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.466518+00	\N
127	14	ACHT	11.06	92.89	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.467949+00	\N
129	15	ROR	1.77	74.45	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.470871+00	\N
130	15	QA	76.68	68.14	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.472513+00	\N
131	15	ACHT	15.08	86.05	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.47387+00	\N
133	16	ROR	2.69	61.8	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.483891+00	\N
134	16	QA	108.01	86.73	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.485208+00	\N
135	16	ACHT	11.45	72.41	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.486473+00	\N
137	17	ROR	1.16	92.59	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.496501+00	\N
138	17	QA	103.88	95	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.498411+00	\N
139	17	ACHT	21.61	67.48	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.499985+00	\N
141	18	ROR	2.07	76.23	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.50288+00	\N
142	18	QA	92.87	61.7	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.504401+00	\N
143	18	ACHT	22.78	88.46	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.514133+00	\N
145	19	ROR	2.63	62.58	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.517536+00	\N
146	19	QA	112.45	83.08	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.524568+00	\N
147	19	ACHT	11.52	73.31	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.526297+00	\N
149	20	ROR	1.74	95.43	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.531823+00	\N
150	20	QA	108.49	88.47	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.535786+00	\N
151	20	ACHT	11.43	79.03	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.53923+00	\N
153	21	ROR	1.19	92.73	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.544261+00	\N
154	21	QA	113.17	76.97	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.563629+00	\N
155	21	ACHT	25.05	90.7	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.565556+00	\N
157	22	ROR	2.6	84.22	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.568888+00	\N
158	22	QA	102.9	99.79	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.570615+00	\N
159	22	ACHT	22.13	73.5	2	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.572113+00	\N
161	2	ROR	1.91	83.36	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.580544+00	\N
162	2	QA	107.82	70.62	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.582304+00	\N
163	2	ACHT	20.15	92.01	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.58421+00	\N
165	3	ROR	1.74	75.47	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.587125+00	\N
166	3	QA	90.79	61.77	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.595807+00	\N
167	3	ACHT	12.78	69.44	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.600925+00	\N
169	4	ROR	2.68	64	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.604596+00	\N
170	4	QA	115.33	62.71	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.606201+00	\N
171	4	ACHT	15.8	74.13	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.607869+00	\N
173	6	ROR	2.27	62.72	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.613083+00	\N
174	6	QA	92.61	78.96	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.617061+00	\N
175	6	ACHT	11.4	76.28	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.619054+00	\N
177	7	ROR	2.27	72.73	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.622101+00	\N
178	7	QA	94.43	96.37	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.623544+00	\N
179	7	ACHT	20.95	98.79	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.626994+00	\N
181	8	ROR	1.31	78.26	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.63134+00	\N
182	8	QA	119.06	61.68	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.632968+00	\N
183	8	ACHT	16.1	93.19	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.63428+00	\N
185	9	ROR	1.56	96.74	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.636965+00	\N
186	9	QA	108.83	83.92	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.645141+00	\N
187	9	ACHT	14.85	93.44	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.647213+00	\N
189	10	ROR	1.84	87.74	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.651713+00	\N
190	10	QA	91.97	64.34	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.653329+00	\N
191	10	ACHT	19.04	80	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.654835+00	\N
193	11	ROR	2.42	89.22	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.657818+00	\N
194	11	QA	105.27	99.15	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.65913+00	\N
195	11	ACHT	15.65	60.35	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.66604+00	\N
197	12	ROR	1.5	62.75	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.669859+00	\N
198	12	QA	112.83	90.58	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.671416+00	\N
199	12	ACHT	25.87	87.91	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.672944+00	\N
201	13	ROR	1.42	68.44	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.676228+00	\N
202	13	QA	88.54	78.21	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.67795+00	\N
203	13	ACHT	15.88	90.55	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.679635+00	\N
205	14	ROR	2.85	96.85	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.682568+00	\N
206	14	QA	119.6	66	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.684363+00	\N
207	14	ACHT	15.44	66.74	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.685795+00	\N
209	15	ROR	2.78	99.7	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.695858+00	\N
210	15	QA	95.01	81.78	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.697584+00	\N
211	15	ACHT	24.57	63.47	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.699022+00	\N
213	16	ROR	1.71	75.42	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.701833+00	\N
214	16	QA	91.09	63.31	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.703186+00	\N
215	16	ACHT	18.62	63.97	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.704509+00	\N
217	17	ROR	1.42	70.97	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.715116+00	\N
218	17	QA	113.75	99.32	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.717031+00	\N
219	17	ACHT	9.95	71.37	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.718719+00	\N
221	18	ROR	1.79	66.93	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.72192+00	\N
222	18	QA	99.56	93.24	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.723561+00	\N
223	18	ACHT	20.99	93.26	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.725286+00	\N
225	19	ROR	2.51	96.33	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.728798+00	\N
226	19	QA	76.92	96.69	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.738179+00	\N
227	19	ACHT	24.42	70.68	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.740085+00	\N
229	20	ROR	2.94	95.95	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.743299+00	\N
230	20	QA	73.3	71.58	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.744877+00	\N
231	20	ACHT	16.79	88.13	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.746489+00	\N
233	21	ROR	1.99	71.84	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.749538+00	\N
234	21	QA	94.33	97.13	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.751188+00	\N
235	21	ACHT	25.27	98.07	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.752828+00	\N
237	22	ROR	1.4	64.62	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.771258+00	\N
238	22	QA	115.33	61.36	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.776973+00	\N
239	22	ACHT	26.5	63.14	3	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.778784+00	\N
241	2	ROR	1.89	96.33	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.781758+00	\N
242	2	QA	105.77	81.47	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.783423+00	\N
243	2	ACHT	25.13	79.44	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.784896+00	\N
245	3	ROR	1.07	86.43	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.788228+00	\N
246	3	QA	94.74	74.76	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.801714+00	\N
247	3	ACHT	13.04	61.17	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.803448+00	\N
249	4	ROR	2.34	66.01	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.806926+00	\N
250	4	QA	77.92	71.11	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.808438+00	\N
251	4	ACHT	9.21	69.97	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.814821+00	\N
253	6	ROR	2.32	94.25	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.819246+00	\N
254	6	QA	109.74	62.76	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.820832+00	\N
255	6	ACHT	13.46	81.01	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.822572+00	\N
257	7	ROR	1.88	75.07	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.831342+00	\N
258	7	QA	82.97	97.77	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.833268+00	\N
259	7	ACHT	19.8	94.22	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.834868+00	\N
261	8	ROR	2.94	94.52	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.838452+00	\N
262	8	QA	112.57	64.61	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.839977+00	\N
263	8	ACHT	23.84	94.51	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.841369+00	\N
265	9	ROR	2.17	96.46	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.844238+00	\N
266	9	QA	100.98	89.68	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.856557+00	\N
267	9	ACHT	18.73	75.29	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.858635+00	\N
269	10	ROR	2.51	99.11	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.86159+00	\N
270	10	QA	83.6	65.93	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.86318+00	\N
271	10	ACHT	16.65	67.18	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.864654+00	\N
273	11	ROR	1.02	77.75	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.867973+00	\N
274	11	QA	73.53	73.2	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.86957+00	\N
275	11	ACHT	15.14	83.51	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.87133+00	\N
277	12	ROR	1.66	84.21	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.882613+00	\N
278	12	QA	92.1	71.66	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.884184+00	\N
279	12	ACHT	10.95	98.27	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.89009+00	\N
281	13	ROR	2.5	65.46	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.89327+00	\N
282	13	QA	102.22	90.03	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.898745+00	\N
283	13	ACHT	14.84	65.52	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.900406+00	\N
285	14	ROR	1.91	70.56	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.90364+00	\N
286	14	QA	102.57	75.49	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.905121+00	\N
287	14	ACHT	17.26	71.87	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.906627+00	\N
289	15	ROR	2.53	90.66	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.916617+00	\N
290	15	QA	77.57	94.13	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.918094+00	\N
291	15	ACHT	8.87	63.48	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.91953+00	\N
293	16	ROR	1.23	93.53	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.92258+00	\N
294	16	QA	82.67	69.37	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.924042+00	\N
295	16	ACHT	17.25	77.07	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.925365+00	\N
297	17	ROR	2.22	89.44	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.928339+00	\N
298	17	QA	116.87	88.57	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.929755+00	\N
299	17	ACHT	17.51	99.4	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.931385+00	\N
301	18	ROR	2	74.61	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.938111+00	\N
302	18	QA	118.97	78.83	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.939946+00	\N
303	18	ACHT	17.64	94.87	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.941426+00	\N
305	19	ROR	1.52	69.27	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.947015+00	\N
306	19	QA	95.05	61.66	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.949148+00	\N
307	19	ACHT	26.31	89.34	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.951165+00	\N
309	20	ROR	2.39	74.56	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.954515+00	\N
310	20	QA	106.29	71.06	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.96266+00	\N
311	20	ACHT	15.74	83.7	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.964525+00	\N
313	21	ROR	1.45	88.36	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.967971+00	\N
314	21	QA	101.78	62.47	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.969539+00	\N
315	21	ACHT	20.36	61.47	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.970998+00	\N
317	22	ROR	2.06	94.77	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.98451+00	\N
318	22	QA	87.93	80.22	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:09.986149+00	\N
319	22	ACHT	24.59	62.99	4	1	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.006396+00	\N
321	2	ROR	1.41	84.32	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.009553+00	\N
322	2	QA	96.18	86.46	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.01151+00	\N
323	2	ACHT	17.11	75.71	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.013108+00	\N
325	3	ROR	2.72	66.37	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.016715+00	\N
326	3	QA	90.7	77.17	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.02428+00	\N
327	3	ACHT	21.35	81.82	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.027756+00	\N
329	4	ROR	2.94	81.97	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.043753+00	\N
330	4	QA	102.54	99.54	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.045463+00	\N
331	4	ACHT	26.18	73.37	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.047241+00	\N
333	6	ROR	2.41	90.33	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.0502+00	\N
334	6	QA	102.17	64.17	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.051661+00	\N
335	6	ACHT	10.16	95.53	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.053123+00	\N
337	7	ROR	2.05	61.37	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.056259+00	\N
338	7	QA	73.62	88.76	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.057608+00	\N
339	7	ACHT	25.12	73.85	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.05892+00	\N
341	8	ROR	1.41	61.08	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.061481+00	\N
342	8	QA	119.86	82.26	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.062939+00	\N
343	8	ACHT	17.82	76.57	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.064793+00	\N
345	9	ROR	2.22	65.76	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.067792+00	\N
346	9	QA	81.25	92.83	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.069154+00	\N
347	9	ACHT	25.2	99.53	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.070525+00	\N
349	10	ROR	2.41	99.24	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.073168+00	\N
350	10	QA	112.32	73.97	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.075074+00	\N
351	10	ACHT	19.64	93.17	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.078689+00	\N
353	11	ROR	2.17	74.26	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.08861+00	\N
354	11	QA	114.01	83.51	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.090693+00	\N
355	11	ACHT	20.13	90.06	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.092075+00	\N
357	12	ROR	1.15	71.16	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.094934+00	\N
358	12	QA	87.55	68.68	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.09633+00	\N
359	12	ACHT	22.84	64.01	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.097686+00	\N
361	13	ROR	1.23	86.73	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.100497+00	\N
362	13	QA	73.28	82.82	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.102873+00	\N
363	13	ACHT	18.41	69.54	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.104275+00	\N
365	14	ROR	1.53	71.14	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.111668+00	\N
366	14	QA	89.37	67.2	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.113466+00	\N
367	14	ACHT	17.66	96.07	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.115006+00	\N
369	15	ROR	1.24	73.8	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.118286+00	\N
370	15	QA	93.89	83.73	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.11989+00	\N
371	15	ACHT	25.86	69.81	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.121293+00	\N
373	16	ROR	2.94	77.35	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.124018+00	\N
374	16	QA	102.56	88.84	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.125306+00	\N
375	16	ACHT	14.53	86.78	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.126648+00	\N
377	17	ROR	2.43	78.72	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.133776+00	\N
378	17	QA	116.06	68.89	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.136098+00	\N
379	17	ACHT	8.94	98.92	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.137459+00	\N
381	18	ROR	1.79	76.83	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.140135+00	\N
382	18	QA	73.89	87.84	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.141464+00	\N
383	18	ACHT	18.98	76.68	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.142827+00	\N
385	19	ROR	1.08	60.97	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.146644+00	\N
386	19	QA	92.94	81.6	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.149101+00	\N
387	19	ACHT	18.84	95.93	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.151093+00	\N
389	20	ROR	2.93	85.33	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.15588+00	\N
390	20	QA	85.17	70.61	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.160617+00	\N
391	20	ACHT	11.08	90.02	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.163069+00	\N
393	21	ROR	2.3	86.22	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.16606+00	\N
394	21	QA	96.66	73.01	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.167539+00	\N
395	21	ACHT	10.55	75.58	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.168932+00	\N
397	22	ROR	2.75	96.32	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.181562+00	\N
398	22	QA	76.29	62.47	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.183422+00	\N
399	22	ACHT	10.7	87.27	5	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.18506+00	\N
401	2	ROR	2.7	66.25	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.188105+00	\N
402	2	QA	106.03	75.26	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.189511+00	\N
403	2	ACHT	24.18	71.21	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.191117+00	\N
405	3	ROR	2.1	77.85	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.19448+00	\N
406	3	QA	118.71	92.34	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.196239+00	\N
407	3	ACHT	11.91	60.16	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.204272+00	\N
409	4	ROR	1.77	61.3	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.207622+00	\N
410	4	QA	94.02	89.41	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.208883+00	\N
411	4	ACHT	11.72	79.88	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.21002+00	\N
413	6	ROR	1.47	82.09	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.220404+00	\N
414	6	QA	115.46	77.16	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.222225+00	\N
415	6	ACHT	26.12	94.73	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.223937+00	\N
417	7	ROR	1.63	77.93	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.227136+00	\N
418	7	QA	99.26	62.63	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.228756+00	\N
419	7	ACHT	9.1	67.39	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.230551+00	\N
421	8	ROR	2.29	71.99	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.233391+00	\N
422	8	QA	80.16	85.76	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.234852+00	\N
423	8	ACHT	9.03	92.28	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.236276+00	\N
425	9	ROR	1.66	99.83	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.244014+00	\N
426	9	QA	118.91	75.92	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.249823+00	\N
427	9	ACHT	13.21	77.73	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.252331+00	\N
429	10	ROR	3	86.66	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.257433+00	\N
430	10	QA	114.92	81.06	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.259329+00	\N
431	10	ACHT	9.28	84.81	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.26115+00	\N
433	11	ROR	1.92	90.53	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.264944+00	\N
434	11	QA	91.04	60.65	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.266602+00	\N
435	11	ACHT	13.16	62.23	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.268021+00	\N
437	12	ROR	2.47	63.4	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.270599+00	\N
438	12	QA	82.07	77.63	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.271861+00	\N
439	12	ACHT	20.75	62.45	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.273206+00	\N
441	13	ROR	2.27	75.04	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.275794+00	\N
442	13	QA	89.88	62.49	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.277105+00	\N
443	13	ACHT	15.88	69.77	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.278485+00	\N
445	14	ROR	1.62	77.54	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.28488+00	\N
446	14	QA	92.92	75.62	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.287085+00	\N
447	14	ACHT	19.03	95.34	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.288607+00	\N
449	15	ROR	1.66	71.38	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.291532+00	\N
450	15	QA	115.65	67.22	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.292842+00	\N
451	15	ACHT	14.93	62.2	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.294251+00	\N
453	16	ROR	2.24	78.39	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.297435+00	\N
454	16	QA	115.88	68.04	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.298939+00	\N
455	16	ACHT	23.08	77.98	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.300199+00	\N
457	17	ROR	2.6	91.92	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.303357+00	\N
458	17	QA	85.28	84.26	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.305293+00	\N
459	17	ACHT	17.97	83.6	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.309499+00	\N
461	18	ROR	1.77	75.96	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.318444+00	\N
462	18	QA	82.22	68.31	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.320577+00	\N
463	18	ACHT	23.4	88.99	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.322756+00	\N
465	19	ROR	1.64	62.92	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.325819+00	\N
466	19	QA	101.38	69.72	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.327185+00	\N
467	19	ACHT	23.36	91.12	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.330708+00	\N
469	20	ROR	2.44	65.64	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.333819+00	\N
470	20	QA	84.95	87.45	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.335138+00	\N
471	20	ACHT	14.4	94.22	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.336436+00	\N
473	21	ROR	1.06	96.86	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.338838+00	\N
474	21	QA	96.17	73.62	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.340171+00	\N
475	21	ACHT	15.4	65.11	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.34141+00	\N
477	22	ROR	2.92	87.56	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.343939+00	\N
478	22	QA	94.03	88.65	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.345265+00	\N
479	22	ACHT	23.77	82.58	6	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.348166+00	\N
481	2	ROR	2.79	69.33	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.350928+00	\N
482	2	QA	77.29	75.35	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.351923+00	\N
483	2	ACHT	19.2	75.94	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.35303+00	\N
485	3	ROR	2.94	68.43	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.355817+00	\N
486	3	QA	108.93	84.51	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.357473+00	\N
487	3	ACHT	11.77	61.73	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.358751+00	\N
489	4	ROR	1.67	77.88	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.361415+00	\N
490	4	QA	72.36	96.23	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.362768+00	\N
491	4	ACHT	16.89	88.73	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.364368+00	\N
493	6	ROR	1.46	82.91	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.36757+00	\N
494	6	QA	88.23	92.59	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.368879+00	\N
495	6	ACHT	15.9	64.28	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.370644+00	\N
497	7	ROR	2.68	76.49	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.373101+00	\N
498	7	QA	82.6	80.44	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.374633+00	\N
499	7	ACHT	11.64	91.4	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.376225+00	\N
501	8	ROR	1.31	83.69	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.379071+00	\N
502	8	QA	118.35	71.94	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.380593+00	\N
503	8	ACHT	16.09	97.43	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.381942+00	\N
505	9	ROR	1.65	64.92	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.384659+00	\N
506	9	QA	87.63	72.91	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.386045+00	\N
507	9	ACHT	19.4	65.3	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.387531+00	\N
509	10	ROR	2.87	67.34	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.390562+00	\N
510	10	QA	115.78	93.51	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.392303+00	\N
511	10	ACHT	18.56	63.34	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.393934+00	\N
513	11	ROR	1.37	66.52	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.397518+00	\N
514	11	QA	102.13	84.43	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.398788+00	\N
515	11	ACHT	14.9	77.21	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.400146+00	\N
517	12	ROR	2.91	81.71	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.402964+00	\N
518	12	QA	72.35	70.22	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.404255+00	\N
519	12	ACHT	24.98	77.43	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.406167+00	\N
521	13	ROR	2.23	79.35	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.409826+00	\N
522	13	QA	78.23	82.9	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.41109+00	\N
523	13	ACHT	23.08	97.3	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.414047+00	\N
525	14	ROR	1.97	71.06	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.416787+00	\N
526	14	QA	93.74	74.18	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.418477+00	\N
527	14	ACHT	13.16	99.78	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.419803+00	\N
529	15	ROR	1.61	99.3	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.424427+00	\N
530	15	QA	116.29	94.14	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.425829+00	\N
531	15	ACHT	19.56	72.62	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.427269+00	\N
533	16	ROR	1.41	63.38	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.433636+00	\N
534	16	QA	81.57	79.21	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.435305+00	\N
535	16	ACHT	11.75	90.77	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.44161+00	\N
537	17	ROR	2.87	76.16	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.445706+00	\N
538	17	QA	70.73	96.36	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.447441+00	\N
539	17	ACHT	23.74	84.09	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.448981+00	\N
541	18	ROR	2.2	73.89	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.452738+00	\N
542	18	QA	103.94	93.19	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.454668+00	\N
543	18	ACHT	10.21	85.09	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.456214+00	\N
545	19	ROR	2.34	85.48	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.459224+00	\N
546	19	QA	74.9	69.68	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.460887+00	\N
547	19	ACHT	16.78	85.48	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.462433+00	\N
549	20	ROR	1.91	61.53	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.465485+00	\N
550	20	QA	110.16	68.43	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.467521+00	\N
551	20	ACHT	23.33	92.66	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.469423+00	\N
553	21	ROR	2.41	77.23	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.472101+00	\N
554	21	QA	103.73	79.47	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.473147+00	\N
555	21	ACHT	24.83	68.89	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.474055+00	\N
557	22	ROR	1.29	82.37	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.477117+00	\N
558	22	QA	88.98	82.86	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.478199+00	\N
559	22	ACHT	11.09	76.42	7	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.47946+00	\N
561	2	ROR	1.5	62.99	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.482262+00	\N
562	2	QA	112.95	72.66	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.483912+00	\N
563	2	ACHT	23.63	67.33	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.485351+00	\N
565	3	ROR	1.43	75.01	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.488462+00	\N
566	3	QA	78.23	89.41	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.489868+00	\N
567	3	ACHT	14.93	84.78	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.491237+00	\N
569	4	ROR	1.29	66.82	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.493681+00	\N
570	4	QA	71.32	96.39	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.495036+00	\N
571	4	ACHT	16.43	85.34	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.496778+00	\N
573	6	ROR	1.06	93.08	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.502089+00	\N
574	6	QA	92.58	64.56	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.503536+00	\N
575	6	ACHT	17.13	70.24	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.504875+00	\N
577	7	ROR	1.91	96.77	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.507517+00	\N
578	7	QA	107.99	82.73	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.508865+00	\N
579	7	ACHT	9.15	65.77	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.510039+00	\N
581	8	ROR	2.28	80.18	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.512683+00	\N
582	8	QA	109.26	87.13	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.514122+00	\N
583	8	ACHT	24.64	78.13	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.515619+00	\N
585	9	ROR	1.87	89.9	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.518651+00	\N
586	9	QA	84.84	73.35	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.520046+00	\N
587	9	ACHT	18.92	82.96	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.521658+00	\N
589	10	ROR	1.68	91.98	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.526795+00	\N
590	10	QA	87.24	69.12	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.533423+00	\N
591	10	ACHT	10.69	83.99	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.53516+00	\N
593	11	ROR	1.44	63.15	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.538559+00	\N
594	11	QA	111.01	79.93	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.540042+00	\N
595	11	ACHT	9.46	63	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.541275+00	\N
597	12	ROR	2.43	95.54	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.543691+00	\N
598	12	QA	85.17	82.6	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.5452+00	\N
599	12	ACHT	17.62	94.88	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.54669+00	\N
601	13	ROR	2.37	68.51	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.549496+00	\N
602	13	QA	92.79	88.84	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.550732+00	\N
603	13	ACHT	17.26	72.62	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.552146+00	\N
605	14	ROR	2.56	92.04	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.554697+00	\N
606	14	QA	88.7	74.14	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.556245+00	\N
607	14	ACHT	24.02	93.71	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.557441+00	\N
609	15	ROR	2.8	99.71	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.560353+00	\N
610	15	QA	115.77	60.9	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.562169+00	\N
611	15	ACHT	22.6	98.09	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.563823+00	\N
613	16	ROR	1	92.45	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.566881+00	\N
614	16	QA	114.12	70.66	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.568282+00	\N
615	16	ACHT	23.38	64.75	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.5696+00	\N
617	17	ROR	1.47	81.36	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.572438+00	\N
618	17	QA	82.92	99.12	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.573608+00	\N
619	17	ACHT	21.98	81.28	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.577555+00	\N
621	18	ROR	1.7	91.87	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.582728+00	\N
622	18	QA	115.06	66.39	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.583988+00	\N
623	18	ACHT	13.07	91.6	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.585156+00	\N
625	19	ROR	2.35	71.08	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.587915+00	\N
626	19	QA	110.61	68.13	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.589001+00	\N
627	19	ACHT	14.63	65.46	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.590418+00	\N
629	20	ROR	1.71	64.61	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.593152+00	\N
630	20	QA	113.58	75.37	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.594484+00	\N
631	20	ACHT	10.15	71.13	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.596843+00	\N
633	21	ROR	1.66	86.09	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.599849+00	\N
634	21	QA	106.97	88.8	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.601077+00	\N
635	21	ACHT	23.84	77.91	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.602243+00	\N
637	22	ROR	2.35	68.88	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.604547+00	\N
638	22	QA	119.83	94.15	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.607743+00	\N
639	22	ACHT	11.51	81.04	8	2	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.609109+00	\N
641	2	ROR	1.72	95.15	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.611929+00	\N
642	2	QA	78.66	89.18	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.61376+00	\N
643	2	ACHT	12.2	60.02	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.615221+00	\N
645	3	ROR	2.23	98.46	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.617755+00	\N
646	3	QA	113.81	88.32	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.619101+00	\N
647	3	ACHT	26.04	81.46	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.620587+00	\N
649	4	ROR	1.97	80.05	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.623781+00	\N
650	4	QA	108.83	63.58	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.625163+00	\N
651	4	ACHT	13.79	88.48	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.626418+00	\N
653	6	ROR	1.94	81.76	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.629019+00	\N
654	6	QA	100.46	63.07	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.631163+00	\N
655	6	ACHT	13.3	98.31	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.633037+00	\N
657	7	ROR	2.25	87.76	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.641021+00	\N
658	7	QA	81.37	83.96	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.643133+00	\N
659	7	ACHT	23.2	79.54	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.644958+00	\N
661	8	ROR	1.91	71.43	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.648179+00	\N
662	8	QA	71.55	87.71	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.657011+00	\N
663	8	ACHT	14.44	75.25	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.659047+00	\N
665	9	ROR	1.7	90.16	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.663141+00	\N
666	9	QA	102.13	75.09	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.664965+00	\N
667	9	ACHT	22.64	97.28	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.666597+00	\N
669	10	ROR	2.18	66.34	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.673863+00	\N
670	10	QA	107.25	98.65	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.675416+00	\N
671	10	ACHT	20.06	75.12	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.676997+00	\N
673	11	ROR	2.13	75.06	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.680251+00	\N
674	11	QA	101.35	70.52	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.681638+00	\N
675	11	ACHT	11.8	71.74	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.683763+00	\N
677	12	ROR	2.54	76.92	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.688027+00	\N
678	12	QA	117.51	89.92	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.69053+00	\N
679	12	ACHT	11.5	77.19	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.692534+00	\N
681	13	ROR	1.2	96.15	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.696396+00	\N
682	13	QA	70.51	96.93	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.698221+00	\N
683	13	ACHT	20.4	71.61	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.699865+00	\N
685	14	ROR	2.85	68.94	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.703064+00	\N
686	14	QA	97.93	72.99	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.704637+00	\N
687	14	ACHT	23.7	77.93	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.706263+00	\N
689	15	ROR	2.9	74.5	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.710772+00	\N
690	15	QA	89.22	80.2	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.713064+00	\N
691	15	ACHT	15.64	86.75	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.716333+00	\N
693	16	ROR	2.89	94.78	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.719296+00	\N
694	16	QA	116.61	73.18	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.720641+00	\N
695	16	ACHT	19	63.38	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.721972+00	\N
697	17	ROR	2	68.2	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.725321+00	\N
698	17	QA	87.73	71.5	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.730051+00	\N
699	17	ACHT	15.2	74.73	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.733162+00	\N
701	18	ROR	1.31	96.88	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.736569+00	\N
702	18	QA	84.62	65.14	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.738155+00	\N
703	18	ACHT	15.38	92.9	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.739901+00	\N
705	19	ROR	1.44	80.71	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.743023+00	\N
706	19	QA	88.44	76.45	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.744739+00	\N
707	19	ACHT	24.36	94.8	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.746615+00	\N
709	20	ROR	1.93	98.16	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.749819+00	\N
710	20	QA	90.66	64.69	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.751667+00	\N
711	20	ACHT	24.25	63.98	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.753726+00	\N
713	21	ROR	1.23	77.24	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.759109+00	\N
714	21	QA	71.24	94.51	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.76089+00	\N
715	21	ACHT	23.59	60.55	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.762712+00	\N
717	22	ROR	1.67	96.56	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.766714+00	\N
718	22	QA	111.58	79.56	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.768194+00	\N
719	22	ACHT	16.23	67.19	9	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.769475+00	\N
721	2	ROR	2.7	96.83	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.77228+00	\N
722	2	QA	101.95	90.92	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.774196+00	\N
723	2	ACHT	24.53	78.3	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.775783+00	\N
725	3	ROR	2.95	65.61	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.780181+00	\N
726	3	QA	113.22	64.85	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.781807+00	\N
727	3	ACHT	9.95	98.69	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.783501+00	\N
729	4	ROR	1.21	95.51	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.786204+00	\N
730	4	QA	72.55	83.25	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.787745+00	\N
731	4	ACHT	19	79.65	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.789052+00	\N
733	6	ROR	2.59	75.84	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.799303+00	\N
734	6	QA	102.63	79.2	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.801618+00	\N
735	6	ACHT	19.8	87.15	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.803341+00	\N
737	7	ROR	1.63	78.04	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.80668+00	\N
738	7	QA	87.23	92.87	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.808089+00	\N
739	7	ACHT	26.54	75.07	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.809365+00	\N
741	8	ROR	2.26	67.27	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.812147+00	\N
742	8	QA	109.51	87.11	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.813485+00	\N
743	8	ACHT	21.16	74.56	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.814937+00	\N
745	9	ROR	2.2	79.52	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.817941+00	\N
746	9	QA	86.24	97.67	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.820079+00	\N
747	9	ACHT	22.94	67.87	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.82172+00	\N
749	10	ROR	1.27	79.37	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.825026+00	\N
750	10	QA	70.49	97.6	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.826625+00	\N
751	10	ACHT	18.32	63.14	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.828114+00	\N
753	11	ROR	2.95	74.78	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.831233+00	\N
754	11	QA	119.35	74.92	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.832986+00	\N
755	11	ACHT	20.31	83.8	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.837363+00	\N
757	12	ROR	2.02	62.04	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.843984+00	\N
758	12	QA	93.65	80.61	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.845349+00	\N
759	12	ACHT	13.27	60.79	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.846848+00	\N
761	13	ROR	1.24	75.18	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.85359+00	\N
762	13	QA	78.39	61.45	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.859654+00	\N
763	13	ACHT	9.93	75.81	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.862108+00	\N
765	14	ROR	2.06	74.75	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.867617+00	\N
766	14	QA	88.1	76.94	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.869402+00	\N
767	14	ACHT	10.19	80.81	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.871412+00	\N
769	15	ROR	2.63	60.94	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.874311+00	\N
770	15	QA	92.53	61.32	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.875862+00	\N
771	15	ACHT	22.38	97.11	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.878062+00	\N
773	16	ROR	2.16	68.08	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.884811+00	\N
774	16	QA	90.4	67.44	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.886174+00	\N
775	16	ACHT	11.56	93.16	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.887763+00	\N
777	17	ROR	1.61	71.64	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.890492+00	\N
778	17	QA	106.39	74.44	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.891652+00	\N
779	17	ACHT	9.92	94.64	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.89289+00	\N
781	18	ROR	2.79	61.75	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.896795+00	\N
782	18	QA	88.35	88.87	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.899702+00	\N
783	18	ACHT	22.66	91.37	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.904181+00	\N
785	19	ROR	2.11	97.86	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.907087+00	\N
786	19	QA	89.38	77.53	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.908354+00	\N
787	19	ACHT	9.23	96.51	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.909775+00	\N
789	20	ROR	1.29	88.03	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.913808+00	\N
790	20	QA	117.3	82.02	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.91554+00	\N
791	20	ACHT	24.73	64.08	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.917189+00	\N
793	21	ROR	1.74	87.27	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.920423+00	\N
794	21	QA	94.71	79.59	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.921736+00	\N
795	21	ACHT	9.5	94.74	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.92295+00	\N
797	22	ROR	2.51	87.61	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.925401+00	\N
798	22	QA	87.21	90.72	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.927726+00	\N
799	22	ACHT	26.4	94.18	10	3	2026	2026-03-07	2026-03-07	\N	2026-03-07 09:04:08.943985+00	2026-03-07 09:04:10.93254+00	\N
945	7	Missed	4.48	0	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 67, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 65, "wi_missed": 3, "overall_missed_pct": 4.48, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 4.62, "missed_contact_rate_live": 4.48}
946	9	Missed	2.74	31.5	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 73, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 2, "wi_offered": 71, "wi_missed": 0, "overall_missed_pct": 2.74, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 2.74}
947	4	Missed	2.36	41	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 127, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 127, "wi_missed": 3, "overall_missed_pct": 2.36, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 2.36, "missed_contact_rate_live": 2.36}
948	16	Missed	1.94	51.5	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "sayarim", "marketplace": "", "site": "VCC_TS", "overall_offered": 103, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 98, "wi_missed": 2, "overall_missed_pct": 1.94, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 2.04, "missed_contact_rate_live": 1.94}
949	13	Missed	1.79	55.25	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "rpradeev", "marketplace": "IN", "site": "VCC_KA", "overall_offered": 112, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 112, "wi_missed": 2, "overall_missed_pct": 1.79, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 1.79, "missed_contact_rate_live": 1.79}
950	8	Missed	0.65	83.75	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "jibiadas", "marketplace": "IN", "site": "VCC_KA", "overall_offered": 155, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 151, "wi_missed": 1, "overall_missed_pct": 0.65, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.66, "missed_contact_rate_live": 0.65}
951	2	Missed	0.65	83.75	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "shajamri", "marketplace": "", "site": "VCC_KA", "overall_offered": 155, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 154, "wi_missed": 1, "overall_missed_pct": 0.65, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.65, "missed_contact_rate_live": 0.65}
952	21	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "anjuumai", "marketplace": "", "site": "VCC_WB", "overall_offered": 127, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 127, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
953	3	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "arurmn", "marketplace": "", "site": "VCC_TN", "overall_offered": 111, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 108, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
954	12	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 53, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 48, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
955	20	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 25, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 25, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
956	10	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 86, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 85, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
957	11	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 36, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 36, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
958	6	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 112, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 112, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
959	22	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 48, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 47, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
960	15	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "mrssll", "marketplace": "", "site": "VCCPHL", "overall_offered": 69, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 69, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
961	14	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "pparwar", "marketplace": "", "site": "VCC_MH", "overall_offered": 109, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 109, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
962	18	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 105, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 103, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
963	17	Missed	0	100	10	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 10", "login": "somsajiv", "marketplace": "", "site": "VCC_TN", "overall_offered": 48, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 45, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
964	22	Missed	17.65	0	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 102, "overall_missed": 18, "chat_offered": 0, "chat_missed": 0, "voice_offered": 8, "voice_missed": 1, "wi_offered": 94, "wi_missed": 17, "overall_missed_pct": 17.65, "chat_missed_pct": 0, "voice_missed_pct": 12.5, "wi_missed_pct": 18.09, "missed_contact_rate_live": 17.65}
965	9	Missed	5.88	0	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 51, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 3, "wi_offered": 46, "wi_missed": 0, "overall_missed_pct": 5.88, "chat_missed_pct": 0, "voice_missed_pct": 60.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 5.88}
966	7	Missed	5.56	0	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 54, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 1, "wi_offered": 50, "wi_missed": 2, "overall_missed_pct": 5.56, "chat_missed_pct": 0, "voice_missed_pct": 25.0, "wi_missed_pct": 4.0, "missed_contact_rate_live": 5.56}
967	12	Missed	5.06	0	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 79, "overall_missed": 4, "chat_offered": 0, "chat_missed": 0, "voice_offered": 13, "voice_missed": 4, "wi_offered": 66, "wi_missed": 0, "overall_missed_pct": 5.06, "chat_missed_pct": 0, "voice_missed_pct": 30.77, "wi_missed_pct": 0.0, "missed_contact_rate_live": 5.06}
968	15	Missed	3.66	8.5	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "mrssll", "marketplace": "", "site": "VCCPHL", "overall_offered": 82, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 2, "wi_offered": 79, "wi_missed": 1, "overall_missed_pct": 3.66, "chat_missed_pct": 0, "voice_missed_pct": 66.67, "wi_missed_pct": 1.27, "missed_contact_rate_live": 3.66}
969	3	Missed	2.15	46.25	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "arurmn", "marketplace": "IN", "site": "VCC_TN", "overall_offered": 93, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 90, "wi_missed": 2, "overall_missed_pct": 2.15, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 2.22, "missed_contact_rate_live": 2.15}
970	16	Missed	1.69	57.75	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "sayarim", "marketplace": "IN", "site": "VCC_TS", "overall_offered": 118, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 16, "voice_missed": 0, "wi_offered": 102, "wi_missed": 2, "overall_missed_pct": 1.69, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.96, "missed_contact_rate_live": 1.69}
971	13	Missed	1.04	74	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "rpradeev", "marketplace": "", "site": "VCC_KA", "overall_offered": 96, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 93, "wi_missed": 1, "overall_missed_pct": 1.04, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.08, "missed_contact_rate_live": 1.04}
972	14	Missed	1	75	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "pparwar", "marketplace": "IN", "site": "VCC_MH", "overall_offered": 100, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 100, "wi_missed": 1, "overall_missed_pct": 1.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 1.0, "missed_contact_rate_live": 1.0}
973	4	Missed	0.72	82	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 139, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 138, "wi_missed": 1, "overall_missed_pct": 0.72, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.72, "missed_contact_rate_live": 0.72}
974	21	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "anjuumai", "marketplace": "", "site": "VCC_WB", "overall_offered": 130, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 130, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
975	20	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 65, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 65, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
976	10	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 124, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 124, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
977	11	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 116, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 116, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
978	6	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 27, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 26, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
979	8	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "jibiadas", "marketplace": "", "site": "VCC_KA", "overall_offered": 158, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 11, "voice_missed": 0, "wi_offered": 147, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
980	18	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 83, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 81, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
981	17	Missed	0	100	11	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 11", "login": "somsajiv", "marketplace": "", "site": "VCC_TN", "overall_offered": 43, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 41, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
982	7	Missed	5.56	0	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 108, "overall_missed": 6, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 4, "wi_offered": 104, "wi_missed": 2, "overall_missed_pct": 5.56, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 1.92, "missed_contact_rate_live": 5.56}
983	22	Missed	5.1	0	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 98, "overall_missed": 5, "chat_offered": 0, "chat_missed": 0, "voice_offered": 7, "voice_missed": 3, "wi_offered": 91, "wi_missed": 2, "overall_missed_pct": 5.1, "chat_missed_pct": 0, "voice_missed_pct": 42.86, "wi_missed_pct": 2.2, "missed_contact_rate_live": 5.1}
984	20	Missed	4.21	0	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 95, "overall_missed": 4, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 3, "wi_offered": 91, "wi_missed": 1, "overall_missed_pct": 4.21, "chat_missed_pct": 0, "voice_missed_pct": 75.0, "wi_missed_pct": 1.1, "missed_contact_rate_live": 4.21}
985	9	Missed	3.57	10.75	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 28, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 1, "wi_offered": 27, "wi_missed": 0, "overall_missed_pct": 3.57, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 3.57}
986	15	Missed	2.86	28.5	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "mrssll", "marketplace": "", "site": "VCCPHL", "overall_offered": 70, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 2, "wi_offered": 67, "wi_missed": 0, "overall_missed_pct": 2.86, "chat_missed_pct": 0, "voice_missed_pct": 66.67, "wi_missed_pct": 0.0, "missed_contact_rate_live": 2.86}
987	3	Missed	0.87	78.25	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "arurmn", "marketplace": "", "site": "VCC_TN", "overall_offered": 115, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 114, "wi_missed": 1, "overall_missed_pct": 0.87, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.88, "missed_contact_rate_live": 0.87}
988	18	Missed	0.68	83	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 146, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 141, "wi_missed": 1, "overall_missed_pct": 0.68, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.71, "missed_contact_rate_live": 0.68}
989	8	Missed	0.67	83.25	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "jibiadas", "marketplace": "IN", "site": "VCC_KA", "overall_offered": 149, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 145, "wi_missed": 1, "overall_missed_pct": 0.67, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.69, "missed_contact_rate_live": 0.67}
990	16	Missed	0.64	84	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "sayarim", "marketplace": "IN", "site": "VCC_TS", "overall_offered": 157, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 9, "voice_missed": 0, "wi_offered": 148, "wi_missed": 1, "overall_missed_pct": 0.64, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.68, "missed_contact_rate_live": 0.64}
991	21	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "anjuumai", "marketplace": "", "site": "VCC_WB", "overall_offered": 111, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 111, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
992	12	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 63, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 59, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
993	4	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 72, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 71, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
994	10	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 106, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 105, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
995	11	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 104, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 104, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
996	6	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 20, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 16, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
997	14	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "pparwar", "marketplace": "", "site": "VCC_MH", "overall_offered": 106, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 106, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
998	13	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "rpradeev", "marketplace": "", "site": "VCC_KA", "overall_offered": 78, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 74, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
999	2	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "shajamri", "marketplace": "", "site": "VCC_KA", "overall_offered": 41, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 39, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1000	17	Missed	0	100	12	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 12", "login": "somsajiv", "marketplace": "", "site": "VCC_TN", "overall_offered": 27, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 27, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1001	20	Missed	2.73	31.75	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 110, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 3, "wi_offered": 105, "wi_missed": 0, "overall_missed_pct": 2.73, "chat_missed_pct": 0, "voice_missed_pct": 60.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 2.73}
1002	7	Missed	2.44	39	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 82, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 2, "wi_offered": 80, "wi_missed": 0, "overall_missed_pct": 2.44, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 2.44}
1003	9	Missed	2.15	46.25	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 93, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 2, "wi_offered": 89, "wi_missed": 0, "overall_missed_pct": 2.15, "chat_missed_pct": 0, "voice_missed_pct": 50.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 2.15}
1004	16	Missed	1.61	59.75	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "sayarim", "marketplace": "IN", "site": "VCC_TS", "overall_offered": 124, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 120, "wi_missed": 2, "overall_missed_pct": 1.61, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.67, "missed_contact_rate_live": 1.61}
1005	12	Missed	1.41	64.75	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 71, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 1, "wi_offered": 68, "wi_missed": 0, "overall_missed_pct": 1.41, "chat_missed_pct": 0, "voice_missed_pct": 33.33, "wi_missed_pct": 0.0, "missed_contact_rate_live": 1.41}
1006	6	Missed	1.35	66.25	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 74, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 73, "wi_missed": 1, "overall_missed_pct": 1.35, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.37, "missed_contact_rate_live": 1.35}
1007	22	Missed	0.93	76.75	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 108, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 1, "wi_offered": 103, "wi_missed": 0, "overall_missed_pct": 0.93, "chat_missed_pct": 0, "voice_missed_pct": 20.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.93}
1008	13	Missed	0.74	81.5	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "rpradeev", "marketplace": "IN", "site": "VCC_KA", "overall_offered": 135, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 15, "voice_missed": 0, "wi_offered": 120, "wi_missed": 1, "overall_missed_pct": 0.74, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.83, "missed_contact_rate_live": 0.74}
1009	3	Missed	0.72	82	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "arurmn", "marketplace": "", "site": "VCC_TN", "overall_offered": 139, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 138, "wi_missed": 1, "overall_missed_pct": 0.72, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.72, "missed_contact_rate_live": 0.72}
1010	2	Missed	0.61	84.75	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "shajamri", "marketplace": "", "site": "VCC_KA", "overall_offered": 165, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 1, "wi_offered": 160, "wi_missed": 0, "overall_missed_pct": 0.61, "chat_missed_pct": 0, "voice_missed_pct": 20.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.61}
1011	21	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "anjuumai", "marketplace": "", "site": "VCC_WB", "overall_offered": 91, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 91, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1012	4	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 116, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 116, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1013	10	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 135, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 131, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1014	11	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 125, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 125, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1015	8	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "jibiadas", "marketplace": "", "site": "VCC_KA", "overall_offered": 148, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 6, "voice_missed": 0, "wi_offered": 142, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1016	14	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "pparwar", "marketplace": "", "site": "VCC_MH", "overall_offered": 96, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 96, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1017	18	Missed	0	100	13	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 13", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 106, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 101, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1018	9	Missed	6.52	0	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 46, "overall_missed": 3, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 2, "wi_offered": 44, "wi_missed": 1, "overall_missed_pct": 6.52, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 2.27, "missed_contact_rate_live": 6.52}
1019	17	Missed	5.63	0	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "somsajiv", "marketplace": "", "site": "VCC_TN", "overall_offered": 71, "overall_missed": 4, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 1, "wi_offered": 69, "wi_missed": 3, "overall_missed_pct": 5.63, "chat_missed_pct": 0, "voice_missed_pct": 50.0, "wi_missed_pct": 4.35, "missed_contact_rate_live": 5.63}
1020	20	Missed	5.38	0	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 93, "overall_missed": 5, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 1, "wi_offered": 91, "wi_missed": 4, "overall_missed_pct": 5.38, "chat_missed_pct": 0, "voice_missed_pct": 50.0, "wi_missed_pct": 4.4, "missed_contact_rate_live": 5.38}
1021	12	Missed	3.64	9	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 55, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 6, "voice_missed": 1, "wi_offered": 49, "wi_missed": 1, "overall_missed_pct": 3.64, "chat_missed_pct": 0, "voice_missed_pct": 16.67, "wi_missed_pct": 2.04, "missed_contact_rate_live": 3.64}
1022	22	Missed	2.27	43.25	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 88, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 1, "wi_offered": 84, "wi_missed": 1, "overall_missed_pct": 2.27, "chat_missed_pct": 0, "voice_missed_pct": 25.0, "wi_missed_pct": 1.19, "missed_contact_rate_live": 2.27}
1023	7	Missed	1.79	55.25	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 112, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 110, "wi_missed": 2, "overall_missed_pct": 1.79, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.82, "missed_contact_rate_live": 1.79}
1024	6	Missed	0.79	80.25	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 126, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 1, "wi_offered": 121, "wi_missed": 0, "overall_missed_pct": 0.79, "chat_missed_pct": 0, "voice_missed_pct": 20.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.79}
1025	21	Missed	0.71	82.25	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "anjuumai", "marketplace": "IN", "site": "VCC_WB", "overall_offered": 141, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 140, "wi_missed": 1, "overall_missed_pct": 0.71, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.71, "missed_contact_rate_live": 0.71}
1026	2	Missed	0.51	87.25	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "shajamri", "marketplace": "", "site": "VCC_KA", "overall_offered": 195, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 191, "wi_missed": 1, "overall_missed_pct": 0.51, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.52, "missed_contact_rate_live": 0.51}
1027	3	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "arurmn", "marketplace": "", "site": "VCC_TN", "overall_offered": 99, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 99, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1028	4	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 83, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 83, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1029	10	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 149, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 146, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1030	11	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 126, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 122, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1031	8	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "jibiadas", "marketplace": "", "site": "VCC_KA", "overall_offered": 156, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 151, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1032	14	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "pparwar", "marketplace": "", "site": "VCC_MH", "overall_offered": 151, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 151, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1033	13	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "rpradeev", "marketplace": "", "site": "VCC_KA", "overall_offered": 60, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 57, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1034	16	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "sayarim", "marketplace": "", "site": "VCC_TS", "overall_offered": 130, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 10, "voice_missed": 0, "wi_offered": 120, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1035	18	Missed	0	100	14	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 14", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 111, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 109, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1036	9	Missed	7.78	0	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 90, "overall_missed": 7, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 1, "wi_offered": 89, "wi_missed": 6, "overall_missed_pct": 7.78, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 6.74, "missed_contact_rate_live": 7.78}
1037	16	Missed	1.96	51	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "sayarim", "marketplace": "IN", "site": "VCC_TS", "overall_offered": 51, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 50, "wi_missed": 1, "overall_missed_pct": 1.96, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 2.0, "missed_contact_rate_live": 1.96}
1038	20	Missed	1.65	58.75	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 121, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 118, "wi_missed": 2, "overall_missed_pct": 1.65, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.69, "missed_contact_rate_live": 1.65}
1039	4	Missed	1.47	63.25	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 136, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 136, "wi_missed": 2, "overall_missed_pct": 1.47, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 1.47, "missed_contact_rate_live": 1.47}
1040	12	Missed	1.43	64.25	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 70, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 1, "wi_offered": 65, "wi_missed": 0, "overall_missed_pct": 1.43, "chat_missed_pct": 0, "voice_missed_pct": 20.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 1.43}
1041	6	Missed	1.26	68.5	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 159, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 6, "voice_missed": 0, "wi_offered": 153, "wi_missed": 2, "overall_missed_pct": 1.26, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 1.31, "missed_contact_rate_live": 1.26}
1042	18	Missed	0.88	78	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 113, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 111, "wi_missed": 1, "overall_missed_pct": 0.88, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.9, "missed_contact_rate_live": 0.88}
1043	7	Missed	0.82	79.5	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 122, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 122, "wi_missed": 1, "overall_missed_pct": 0.82, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.82, "missed_contact_rate_live": 0.82}
1044	22	Missed	0.68	83	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 146, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 143, "wi_missed": 1, "overall_missed_pct": 0.68, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.7, "missed_contact_rate_live": 0.68}
1045	2	Missed	0.65	83.75	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "shajamri", "marketplace": "", "site": "VCC_KA", "overall_offered": 154, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 7, "voice_missed": 0, "wi_offered": 147, "wi_missed": 1, "overall_missed_pct": 0.65, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.68, "missed_contact_rate_live": 0.65}
1046	21	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "anjuumai", "marketplace": "", "site": "VCC_WB", "overall_offered": 146, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 146, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1047	3	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "arurmn", "marketplace": "", "site": "VCC_TN", "overall_offered": 113, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 113, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1048	10	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 89, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 84, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1049	11	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 165, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 165, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1050	8	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "jibiadas", "marketplace": "", "site": "VCC_KA", "overall_offered": 135, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 3, "voice_missed": 0, "wi_offered": 132, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1051	14	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "pparwar", "marketplace": "", "site": "VCC_MH", "overall_offered": 115, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 115, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1052	13	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "rpradeev", "marketplace": "", "site": "VCC_KA", "overall_offered": 117, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 112, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1053	17	Missed	0	100	15	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 15", "login": "somsajiv", "marketplace": "", "site": "VCC_TN", "overall_offered": 86, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 85, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1054	12	Missed	9.76	0	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "bhaskpri", "marketplace": "", "site": "VCC_KA", "overall_offered": 41, "overall_missed": 4, "chat_offered": 0, "chat_missed": 0, "voice_offered": 9, "voice_missed": 4, "wi_offered": 32, "wi_missed": 0, "overall_missed_pct": 9.76, "chat_missed_pct": 0, "voice_missed_pct": 44.44, "wi_missed_pct": 0.0, "missed_contact_rate_live": 9.76}
1055	9	Missed	7.27	0	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "jmadhum", "marketplace": "", "site": "VCC_KA", "overall_offered": 55, "overall_missed": 4, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 1, "wi_offered": 54, "wi_missed": 3, "overall_missed_pct": 7.27, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 5.56, "missed_contact_rate_live": 7.27}
1056	22	Missed	2.04	49	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "mishrary", "marketplace": "", "site": "VCC_WB", "overall_offered": 98, "overall_missed": 2, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 2, "wi_offered": 93, "wi_missed": 0, "overall_missed_pct": 2.04, "chat_missed_pct": 0, "voice_missed_pct": 40.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 2.04}
1057	7	Missed	1.79	55.25	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "gujagann", "marketplace": "", "site": "VCC_WB", "overall_offered": 56, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 1, "wi_offered": 55, "wi_missed": 0, "overall_missed_pct": 1.79, "chat_missed_pct": 0, "voice_missed_pct": 100.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 1.79}
1058	21	Missed	1.49	62.75	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "anjuumai", "marketplace": "", "site": "VCC_WB", "overall_offered": 67, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 67, "wi_missed": 1, "overall_missed_pct": 1.49, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 1.49, "missed_contact_rate_live": 1.49}
1059	20	Missed	1.41	64.75	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "datathag", "marketplace": "", "site": "VCC_WB", "overall_offered": 71, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 1, "wi_offered": 69, "wi_missed": 0, "overall_missed_pct": 1.41, "chat_missed_pct": 0, "voice_missed_pct": 50.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 1.41}
1060	4	Missed	0.85	78.75	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "darunkuv", "marketplace": "", "site": "VCC_TN", "overall_offered": 118, "overall_missed": 1, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 118, "wi_missed": 1, "overall_missed_pct": 0.85, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.85, "missed_contact_rate_live": 0.85}
1061	3	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "arurmn", "marketplace": "", "site": "VCC_TN", "overall_offered": 73, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 73, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1062	10	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "fmehru", "marketplace": "", "site": "VCC_KL", "overall_offered": 112, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 4, "voice_missed": 0, "wi_offered": 108, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1063	11	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "gargnoo", "marketplace": "", "site": "VCC_DL", "overall_offered": 63, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 63, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1064	6	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "hulman", "marketplace": "", "site": "VCC_KA", "overall_offered": 107, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 102, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1065	8	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "jibiadas", "marketplace": "", "site": "VCC_KA", "overall_offered": 34, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 34, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1066	14	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "pparwar", "marketplace": "", "site": "VCC_MH", "overall_offered": 54, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 54, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1067	13	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "rpradeev", "marketplace": "", "site": "VCC_KA", "overall_offered": 54, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 7, "voice_missed": 0, "wi_offered": 47, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1068	16	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "sayarim", "marketplace": "", "site": "VCC_TS", "overall_offered": 58, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 1, "voice_missed": 0, "wi_offered": 57, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1069	18	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "sekumarz", "marketplace": "", "site": "VCC_TN", "overall_offered": 76, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 0, "voice_missed": 0, "wi_offered": 76, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1070	2	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "shajamri", "marketplace": "", "site": "VCC_KA", "overall_offered": 140, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 5, "voice_missed": 0, "wi_offered": 135, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
1071	17	Missed	0	100	16	\N	2026	\N	\N	Missed_Contacts_by_W_1776426559419.xlsx	2026-04-17 12:55:35.68138+00	2026-04-17 12:55:35.68138+00	{"week": "2026 Week 16", "login": "somsajiv", "marketplace": "", "site": "VCC_TN", "overall_offered": 88, "overall_missed": 0, "chat_offered": 0, "chat_missed": 0, "voice_offered": 2, "voice_missed": 0, "wi_offered": 86, "wi_missed": 0, "overall_missed_pct": 0.0, "chat_missed_pct": 0, "voice_missed_pct": 0.0, "wi_missed_pct": 0.0, "missed_contact_rate_live": 0.0}
\.


--
-- Data for Name: metric_files; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.metric_files (id, user_id, metric_code, file_name, file_path, processed, uploaded_at, processed_at) FROM stdin;
1	1	ACHT	Week 06 ACHT.xlsx	uploads/metrics/1_ACHT_Week 06 ACHT.xlsx	t	2026-03-12 10:15:12.152508+00	\N
2	1	ACHT	Week 06 ACHT.xlsx	uploads/metrics/1_ACHT_Week 06 ACHT.xlsx	t	2026-03-12 10:21:22.453748+00	\N
3	1	ACHT	Week 06 ACHT.xlsx	uploads/metrics/1_ACHT_Week 06 ACHT.xlsx	t	2026-03-12 10:34:24.691977+00	\N
4	1	ACHT	Week 06 ACHT.xlsx	uploads/metrics/1_ACHT_Week 06 ACHT.xlsx	t	2026-03-12 14:42:47.416414+00	\N
5	1	ACHT	Week 06 ACHT.xlsx	uploads/metrics/1_ACHT_Week 06 ACHT.xlsx	t	2026-03-13 05:16:48.719775+00	\N
6	1	ACHT	Week 06 ACHT.xlsx	uploads/metrics/1_ACHT_Week 06 ACHT.xlsx	t	2026-04-17 04:36:40.548741+00	\N
7	1	ACHT	Week 13 ACHT.xlsx	uploads/metrics/1_ACHT_Week 13 ACHT.xlsx	t	2026-04-17 04:45:14.171426+00	\N
\.


--
-- Data for Name: metric_goals; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.metric_goals (id, metric_name, metric_code, goal_value, green_threshold, yellow_threshold, red_threshold, goal_direction, weight, unit, is_active, created_at, updated_at, is_higher_better, description) FROM stdin;
1	Reopen On Resolve	ROR	2	3	6	10	lower_is_better	25	%	t	2026-03-11 17:20:28.383435+00	2026-03-11 17:20:28.383435+00	f	\N
2	Quality Assurance	QA	100	85	75	70	higher_is_better	25	%	t	2026-03-11 17:20:28.383435+00	2026-03-11 17:20:28.383435+00	t	\N
3	Average Contact Handling Time	ACHT	17.7	12	15	20	lower_is_better	25	minutes	t	2026-03-11 17:20:28.383435+00	2026-03-11 17:20:28.383435+00	f	\N
4	Missed Contact	Missed	2	2	5	10	lower_is_better	25	%	t	2026-03-11 17:20:28.383435+00	2026-03-11 17:20:28.383435+00	f	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.notifications (id, title, message, type, is_read, user_id, created_at) FROM stdin;
500	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	6	2026-03-12 13:23:08.18721+00
505	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	11	2026-03-12 13:23:08.225319+00
510	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	18	2026-03-12 13:23:08.259969+00
5	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	21	2026-03-09 00:24:09.869133+00
6	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	9	2026-03-09 00:24:09.950056+00
7	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	13	2026-03-09 00:24:10.055437+00
9	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	21	2026-03-09 00:34:18.861281+00
10	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	9	2026-03-09 00:34:19.133278+00
11	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	13	2026-03-09 00:34:19.339669+00
495	Leave Announced	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	t	1	2026-03-12 13:23:08.148823+00
517	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:08:48.977405+00
520	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:08:49.002895+00
523	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:08:49.022858+00
526	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:08:49.043251+00
529	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:08:49.066042+00
532	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:08:49.093534+00
515	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	t	14	2026-03-12 13:23:08.297202+00
541	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:31:56.798812+00
546	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:31:56.838768+00
551	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:31:56.883237+00
560	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:32:04.157867+00
565	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:32:04.196978+00
27	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	t	12	2026-03-09 00:24:09.596187+00
28	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	t	12	2026-03-09 00:34:18.297046+00
570	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:32:04.240189+00
575	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:32:04.283307+00
662	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:39:55.526419+00
667	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:39:55.566543+00
672	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:39:55.608872+00
535	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	t	16	2026-03-12 14:08:49.116956+00
556	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	t	16	2026-03-12 14:31:56.930027+00
679	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:40:24.44776+00
684	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:40:24.489598+00
689	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:40:24.52993+00
694	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:40:24.568835+00
700	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:41:17.353174+00
706	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:41:17.412367+00
712	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:41:17.478731+00
657	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:39:55.480455+00
721	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	4	2026-03-12 15:24:16.221776+00
47	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	18	2026-03-09 00:24:09.695+00
48	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	22	2026-03-09 00:24:09.880904+00
49	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	2	2026-03-09 00:24:09.962475+00
50	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	t	14	2026-03-09 00:24:10.082284+00
51	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	18	2026-03-09 00:34:18.531432+00
52	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	22	2026-03-09 00:34:19.011525+00
53	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	2	2026-03-09 00:34:19.175143+00
54	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	t	1	2026-03-09 00:34:19.362065+00
725	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	9	2026-03-12 15:24:16.249211+00
729	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	15	2026-03-12 15:24:16.273674+00
733	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	20	2026-03-12 15:24:16.300977+00
737	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	16	2026-03-12 15:24:16.329969+00
717	Leave Announced	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	t	1	2026-03-12 15:24:16.189042+00
746	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	7	2026-03-13 05:30:47.438737+00
752	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	22	2026-03-13 05:30:47.521405+00
758	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	11	2026-03-13 05:30:47.584896+00
762	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	8	2026-03-13 08:35:14.215138+00
496	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	12	2026-03-12 13:23:08.161514+00
501	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	7	2026-03-12 13:23:08.193757+00
506	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	13	2026-03-12 13:23:08.232377+00
511	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	19	2026-03-12 13:23:08.266783+00
518	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:08:48.98788+00
521	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:08:49.009616+00
524	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:08:49.029082+00
527	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:08:49.050706+00
530	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:08:49.075614+00
533	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:08:49.101404+00
536	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	t	14	2026-03-12 14:08:49.124063+00
582	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	6	2026-03-12 14:38:59.42164+00
587	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	11	2026-03-12 14:38:59.462093+00
79	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	19	2026-03-09 00:24:09.752083+00
80	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	16	2026-03-09 00:24:09.895404+00
81	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	3	2026-03-09 00:24:09.976935+00
82	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	19	2026-03-09 00:34:18.689027+00
83	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	16	2026-03-09 00:34:19.030137+00
84	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	3	2026-03-09 00:34:19.208515+00
592	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	19	2026-03-12 14:38:59.501333+00
602	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	6	2026-03-12 14:39:08.175776+00
607	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	11	2026-03-12 14:39:08.219375+00
612	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	19	2026-03-12 14:39:08.262115+00
622	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:39:16.700674+00
627	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:39:16.740641+00
632	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:39:16.782722+00
642	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	6	2026-03-12 14:39:24.553081+00
647	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	11	2026-03-12 14:39:24.592032+00
652	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	19	2026-03-12 14:39:24.644866+00
658	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:39:55.491663+00
663	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:39:55.534228+00
668	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:39:55.575097+00
673	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:39:55.617513+00
682	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:40:24.473481+00
687	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:40:24.514573+00
692	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:40:24.552785+00
702	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:41:17.373057+00
708	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:41:17.433875+00
714	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:41:17.501729+00
577	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	t	1	2026-03-12 14:38:59.377107+00
597	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	t	1	2026-03-12 14:39:08.127824+00
111	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	20	2026-03-09 00:24:09.768327+00
112	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	6	2026-03-09 00:24:09.910134+00
617	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:39:16.653073+00
637	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	t	1	2026-03-12 14:39:24.513229+00
677	Leave Announced	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:40:24.427596+00
718	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	12	2026-03-12 15:24:16.200316+00
722	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	6	2026-03-12 15:24:16.229195+00
726	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	10	2026-03-12 15:24:16.255403+00
119	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	4	2026-03-09 00:24:09.989373+00
120	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	20	2026-03-09 00:34:18.7094+00
121	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	6	2026-03-09 00:34:19.054826+00
122	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	4	2026-03-09 00:34:19.226977+00
730	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	17	2026-03-12 15:24:16.280689+00
734	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	21	2026-03-12 15:24:16.308229+00
497	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	2	2026-03-12 13:23:08.168708+00
502	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	8	2026-03-12 13:23:08.200439+00
507	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	15	2026-03-12 13:23:08.241604+00
512	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	20	2026-03-12 13:23:08.273445+00
542	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:31:56.806252+00
547	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:31:56.847347+00
552	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:31:56.894791+00
561	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:32:04.165509+00
566	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:32:04.204907+00
571	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:32:04.248931+00
578	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	12	2026-03-12 14:38:59.389169+00
583	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	7	2026-03-12 14:38:59.430337+00
588	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	13	2026-03-12 14:38:59.470189+00
593	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	20	2026-03-12 14:38:59.508887+00
598	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	12	2026-03-12 14:39:08.140299+00
603	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	7	2026-03-12 14:39:08.183748+00
608	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	13	2026-03-12 14:39:08.227349+00
613	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	20	2026-03-12 14:39:08.270811+00
619	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:39:16.672989+00
624	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:39:16.717+00
629	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:39:16.757366+00
634	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:39:16.798533+00
638	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	12	2026-03-12 14:39:24.522304+00
643	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	7	2026-03-12 14:39:24.560505+00
648	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	13	2026-03-12 14:39:24.613279+00
653	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	20	2026-03-12 14:39:24.652656+00
659	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:39:55.502144+00
664	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:39:55.542221+00
669	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:39:55.583722+00
674	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:39:55.62587+00
576	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	t	16	2026-03-12 14:32:04.292183+00
681	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:40:24.464821+00
686	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:40:24.506718+00
691	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:40:24.545023+00
161	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	15	2026-03-09 00:24:09.82098+00
162	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	7	2026-03-09 00:24:09.921146+00
164	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	10	2026-03-09 00:24:10.018119+00
165	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	15	2026-03-09 00:34:18.755897+00
166	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	7	2026-03-09 00:34:19.080247+00
167	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	10	2026-03-09 00:34:19.262647+00
703	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:41:17.384781+00
709	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:41:17.444669+00
715	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:41:17.51245+00
537	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:31:56.760698+00
697	Leave Announced	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:41:17.325947+00
719	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	2	2026-03-12 15:24:16.208025+00
723	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	7	2026-03-12 15:24:16.23645+00
727	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	11	2026-03-12 15:24:16.261321+00
731	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	18	2026-03-12 15:24:16.28743+00
735	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	22	2026-03-12 15:24:16.315915+00
696	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	t	14	2026-03-12 14:40:24.58491+00
742	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	8	2026-03-13 05:30:47.36143+00
748	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	10	2026-03-13 05:30:47.466548+00
754	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	17	2026-03-13 05:30:47.542321+00
740	Leave Announced	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	t	1	2026-03-13 05:30:47.318846+00
765	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	6	2026-03-13 08:35:14.249055+00
498	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	3	2026-03-12 13:23:08.174875+00
503	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	9	2026-03-12 13:23:08.207052+00
513	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	21	2026-03-12 13:23:08.280057+00
508	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	t	16	2026-03-12 13:23:08.247563+00
538	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:31:56.776332+00
543	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:31:56.814274+00
548	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:31:56.855752+00
553	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:31:56.903562+00
562	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	6	2026-03-12 14:32:04.17324+00
567	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:32:04.213346+00
572	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:32:04.257667+00
579	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	2	2026-03-12 14:38:59.397254+00
584	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	8	2026-03-12 14:38:59.438545+00
589	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	15	2026-03-12 14:38:59.478372+00
594	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	21	2026-03-12 14:38:59.516458+00
600	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	3	2026-03-12 14:39:08.159849+00
605	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	9	2026-03-12 14:39:08.199751+00
610	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	17	2026-03-12 14:39:08.244388+00
615	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	22	2026-03-12 14:39:08.286502+00
618	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:39:16.663257+00
623	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:39:16.708552+00
628	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:39:16.748666+00
633	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:39:16.791285+00
639	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	2	2026-03-12 14:39:24.532137+00
644	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	8	2026-03-12 14:39:24.567548+00
649	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	15	2026-03-12 14:39:24.620821+00
654	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	21	2026-03-12 14:39:24.660914+00
660	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:39:55.510569+00
665	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:39:55.550254+00
670	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:39:55.591658+00
675	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:39:55.634284+00
680	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:40:24.456598+00
685	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:40:24.498365+00
690	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:40:24.53726+00
695	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:40:24.576736+00
698	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:41:17.336174+00
704	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:41:17.394169+00
710	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:41:17.457145+00
716	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	16	2026-03-12 14:41:17.523527+00
557	Leave Announced	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:32:04.124261+00
720	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	3	2026-03-12 15:24:16.214549+00
724	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	8	2026-03-12 15:24:16.242945+00
728	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	13	2026-03-12 15:24:16.267271+00
732	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	f	19	2026-03-12 15:24:16.294251+00
736	Team Leave Update	Mounika Narote has announced annual leave on 27 Mar 2026	ot_leave_submitted	t	14	2026-03-12 15:24:16.322872+00
744	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	4	2026-03-13 05:30:47.404976+00
750	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	15	2026-03-13 05:30:47.494009+00
756	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	20	2026-03-13 05:30:47.562462+00
761	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	3	2026-03-13 08:35:14.20026+00
767	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	9	2026-03-13 08:35:14.269913+00
771	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	18	2026-03-13 08:35:14.305316+00
773	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	12	2026-03-13 08:35:14.329592+00
777	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	21	2026-03-13 08:35:14.37688+00
779	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	16	2026-03-13 08:35:14.394902+00
499	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	4	2026-03-12 13:23:08.180657+00
504	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	10	2026-03-12 13:23:08.217535+00
509	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	17	2026-03-12 13:23:08.253965+00
514	Team Leave Update	Mounika Narote has announced other leave on 20 Mar 2026	ot_leave_submitted	f	22	2026-03-12 13:23:08.287004+00
539	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:31:56.784712+00
544	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:31:56.82215+00
549	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:31:56.863887+00
554	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:31:56.912426+00
559	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:32:04.149478+00
564	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	8	2026-03-12 14:32:04.189433+00
569	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:32:04.230911+00
574	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	21	2026-03-12 14:32:04.274853+00
580	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	3	2026-03-12 14:38:59.405092+00
585	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	9	2026-03-12 14:38:59.446454+00
590	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	17	2026-03-12 14:38:59.485862+00
595	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	22	2026-03-12 14:38:59.524418+00
599	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	2	2026-03-12 14:39:08.15126+00
604	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	8	2026-03-12 14:39:08.191686+00
609	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	15	2026-03-12 14:39:08.234808+00
614	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	21	2026-03-12 14:39:08.278469+00
620	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:39:16.68237+00
625	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:39:16.724871+00
630	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:39:16.766216+00
635	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:39:16.806413+00
640	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	3	2026-03-12 14:39:24.539435+00
645	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	9	2026-03-12 14:39:24.57553+00
650	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	17	2026-03-12 14:39:24.629078+00
655	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	22	2026-03-12 14:39:24.668729+00
661	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:39:55.518813+00
666	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:39:55.558732+00
671	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:39:55.600337+00
676	Leave Cancelled	Pragya Parwar has cancelled sick leave on 11 Mar 2026	ot_leave_submitted	t	16	2026-03-12 14:39:55.642322+00
678	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:40:24.437819+00
683	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:40:24.481537+00
688	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:40:24.522322+00
693	Team Leave Update	SAYARI MONDAL has announced annual leave on 20 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:40:24.560598+00
699	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	2	2026-03-12 14:41:17.34498+00
705	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:41:17.403346+00
711	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:41:17.468404+00
738	New OT Report Submitted	Pragya Parwar has submitted OT report for 2026-03	ot_leave_submitted	t	1	2026-03-13 05:26:08.870373+00
741	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	3	2026-03-13 05:30:47.343819+00
745	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	6	2026-03-13 05:30:47.424236+00
747	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	9	2026-03-13 05:30:47.452862+00
751	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	18	2026-03-13 05:30:47.510001+00
753	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	12	2026-03-13 05:30:47.531826+00
757	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	21	2026-03-13 05:30:47.573731+00
759	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	16	2026-03-13 05:30:47.600532+00
764	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	4	2026-03-13 08:35:14.23605+00
766	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	7	2026-03-13 08:35:14.261034+00
770	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	15	2026-03-13 08:35:14.29691+00
772	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	22	2026-03-13 08:35:14.313817+00
776	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	20	2026-03-13 08:35:14.367624+00
760	Leave Announced	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	t	1	2026-03-13 08:35:14.173169+00
519	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:08:48.995264+00
522	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:08:49.016403+00
525	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:08:49.036855+00
528	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	15	2026-03-12 14:08:49.057944+00
531	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	19	2026-03-12 14:08:49.086033+00
534	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:08:49.109437+00
516	Leave Cancelled	Mounika Narote has cancelled casual leave on 16 Mar 2026 to 19 Mar 2026	ot_leave_submitted	t	1	2026-03-12 14:08:48.958853+00
540	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	3	2026-03-12 14:31:56.791527+00
545	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	9	2026-03-12 14:31:56.830378+00
550	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	17	2026-03-12 14:31:56.873045+00
555	Leave Cancelled	Pragya Parwar has cancelled sick leave on 20 Mar 2026	ot_leave_submitted	f	22	2026-03-12 14:31:56.920995+00
558	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	12	2026-03-12 14:32:04.135362+00
563	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	7	2026-03-12 14:32:04.181377+00
568	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	13	2026-03-12 14:32:04.222392+00
573	Team Leave Update	Pragya Parwar has announced casual leave on 17 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:32:04.266466+00
581	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	4	2026-03-12 14:38:59.413352+00
586	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	10	2026-03-12 14:38:59.454212+00
341	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	17	2026-03-09 00:24:09.8514+00
342	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	8	2026-03-09 00:24:09.937596+00
343	New Success Story	Mounika Narote submitted a success story on 09 Mar 2026	success_story	f	11	2026-03-09 00:24:10.034542+00
344	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	17	2026-03-09 00:34:18.832897+00
345	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	8	2026-03-09 00:34:19.094237+00
346	New Success Story	Pragya Parwar submitted a success story on 09 Mar 2026	success_story	f	11	2026-03-09 00:34:19.282492+00
591	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	f	18	2026-03-12 14:38:59.49328+00
601	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	4	2026-03-12 14:39:08.167781+00
606	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	10	2026-03-12 14:39:08.207444+00
611	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	f	18	2026-03-12 14:39:08.253347+00
621	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:39:16.691286+00
626	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	10	2026-03-12 14:39:16.732909+00
631	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	f	18	2026-03-12 14:39:16.774718+00
641	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	4	2026-03-12 14:39:24.546269+00
646	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	10	2026-03-12 14:39:24.584314+00
651	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	f	18	2026-03-12 14:39:24.637082+00
596	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 26 Feb 2026	ot_leave_submitted	t	16	2026-03-12 14:38:59.531868+00
616	Leave Cancelled	Pragya Parwar has cancelled sick leave on 26 Feb 2026 to 27 Feb 2026	ot_leave_submitted	t	16	2026-03-12 14:39:08.294704+00
636	Leave Cancelled	Pragya Parwar has cancelled casual leave on 25 Feb 2026 to 01 Mar 2026	ot_leave_submitted	t	16	2026-03-12 14:39:16.81337+00
656	Leave Cancelled	Pragya Parwar has cancelled annual leave on 25 Feb 2026 to 28 Feb 2026	ot_leave_submitted	t	16	2026-03-12 14:39:24.676923+00
701	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	4	2026-03-12 14:41:17.361836+00
707	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	11	2026-03-12 14:41:17.423087+00
713	Team Leave Update	Pragya Parwar has announced sick leave on 12 Mar 2026	ot_leave_submitted	f	20	2026-03-12 14:41:17.490809+00
739	OT Report Delivered	Your OT report for 2026-03 has been delivered to manager	ot_leave_submitted	t	14	2026-03-13 05:26:08.891409+00
743	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	2	2026-03-13 05:30:47.387817+00
749	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	13	2026-03-13 05:30:47.479695+00
755	Team Leave Update	Pragya Parwar has announced casual leave on 28 Mar 2026	ot_leave_submitted	f	19	2026-03-13 05:30:47.551793+00
763	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	2	2026-03-13 08:35:14.225344+00
768	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	10	2026-03-13 08:35:14.278164+00
769	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	13	2026-03-13 08:35:14.288098+00
774	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	17	2026-03-13 08:35:14.344294+00
775	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	19	2026-03-13 08:35:14.356014+00
778	Team Leave Update	Pragya Parwar has announced annual leave on 01 Apr 2026 to 03 Apr 2026	ot_leave_submitted	f	11	2026-03-13 08:35:14.385816+00
781	OT Report Delivered	Your OT report for 2026-04 has been delivered to manager	ot_leave_submitted	f	14	2026-04-17 05:52:53.114002+00
780	New OT Report Submitted	Pragya Parwar has submitted OT report for 2026-04	ot_leave_submitted	t	1	2026-04-17 05:52:53.105773+00
\.


--
-- Data for Name: ot_submissions; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.ot_submissions (id, user_id, date, start_time, end_time, hours, ot_type, reason, status, rejection_reason, is_delivered, is_viewed, created_at, reviewed_at) FROM stdin;
1	14	2026-01-14	15:22	23:22	8	OT	OT	PENDING	\N	t	t	2026-02-23 08:52:58.121472+00	\N
2	14	2026-01-01	17:00	19:00	2	OT	OT	PENDING	\N	t	t	2026-02-23 09:18:10.047924+00	\N
3	16	2026-02-04	07:00	13:00	6	OT	OT	PENDING	\N	t	t	2026-02-24 02:59:12.990242+00	\N
4	16	2026-02-18	19:00	03:00	8	NSA	NSA	PENDING	\N	t	t	2026-02-24 05:46:31.963874+00	\N
5	16	2026-02-20	15:00	23:00	8	ASA	ASA	PENDING	\N	t	t	2026-02-24 05:47:07.010326+00	\N
6	16	2026-02-20	12:00	16:00	4	OT	OT	PENDING	\N	t	t	2026-02-24 07:05:40.710261+00	\N
7	16	2026-02-20	12:00	17:00	5	OT	OT	PENDING	\N	t	t	2026-02-24 07:05:43.552074+00	\N
8	14	2026-03-09	12:00	14:00	2	OT	OT	PENDING	\N	t	t	2026-03-09 23:13:08.593266+00	\N
21	14	2026-03-10	14:00	16:00	2	OT	\N	pending	\N	t	t	2026-03-12 07:24:25.786912+00	\N
22	14	2026-03-10	21:00	03:00	6	NSA	NSA	pending	\N	t	t	2026-03-12 10:53:52.118597+00	\N
23	14	2026-03-16	15:00	19:00	4	OT	OT	pending	\N	t	t	2026-03-13 05:25:53.827643+00	\N
9	14	2026-02-19	03:00	07:00	4	OT	OT	PENDING	\N	t	t	2026-02-23 10:17:07.779973+00	\N
10	14	2026-02-18	03:00	06:00	3	OT	OT	PENDING	\N	t	t	2026-02-23 10:22:10.954927+00	\N
11	14	2026-02-16	19:00	03:00	8	NSA	NSA	PENDING	\N	t	t	2026-02-23 09:17:08.124406+00	\N
12	14	2026-02-12	08:00	12:00	4	OT	OT	PENDING	\N	t	t	2026-02-18 07:48:11.887884+00	\N
13	14	2026-02-12	09:00	17:00	8	NSA	NSA	PENDING	\N	t	t	2026-02-18 07:48:28.83113+00	\N
14	14	2026-02-13	09:00	17:00	8	ASA	ASA	PENDING	\N	t	t	2026-02-18 07:48:46.383861+00	\N
15	14	2026-02-18	16:00	21:00	5	OT	OT	PENDING	\N	t	t	2026-02-23 08:46:10.880992+00	\N
16	14	2026-02-10	21:00	05:00	8	NSA	NSA	PENDING	\N	t	t	2026-02-23 08:46:51.006762+00	\N
17	14	2026-02-12	16:00	00:00	8	ASA	ASA	PENDING	\N	t	t	2026-02-23 08:47:20.595285+00	\N
18	14	2026-02-23	07:00	13:00	6	OT	OT	PENDING	\N	t	t	2026-02-23 09:01:08.758065+00	\N
19	14	2026-02-23	23:00	03:00	4	NSA	NSA	PENDING	\N	t	t	2026-02-23 09:05:44.128735+00	\N
20	14	2026-02-11	19:00	22:00	3	OT	OT	PENDING	\N	t	t	2026-02-23 09:51:04.41071+00	\N
24	14	2026-04-14	08:30	10:30	2	OT	OT	pending	\N	t	t	2026-04-17 05:52:48.700267+00	\N
\.


--
-- Data for Name: poll_options; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.poll_options (id, poll_id, option_text) FROM stdin;
1	1	Trained
2	1	Not Trained
3	1	Need Refresher
4	2	6:00 PM
5	2	4:00 PM
6	3	On Holiday
7	3	Working
\.


--
-- Data for Name: poll_votes; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.poll_votes (id, poll_id, option_id, user_id, voted_at) FROM stdin;
1	1	2	16	2026-03-07 18:11:39.130249
2	1	3	12	2026-03-07 18:12:06.475185
3	1	2	1	2026-03-07 18:18:26.467
4	1	1	14	2026-03-09 22:50:10.298386
5	2	5	16	2026-03-07 18:33:19.980816
6	2	4	12	2026-03-07 18:33:36.347976
7	2	4	14	2026-03-09 22:50:02.196575
8	3	7	14	2026-03-12 11:51:46.232675
\.


--
-- Data for Name: polls; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.polls (id, question, created_by, created_at, is_active) FROM stdin;
1	Who all are Trained in Sandfire	1	2026-03-07 07:58:05.101343	t
2	What should be next meeting time ?	1	2026-03-07 18:32:58.958289	t
3	How many off you are on Leave on Mandatory holiday.	1	2026-03-12 11:51:29.733434	t
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.skills (id, skill_code, team_name, is_active) FROM stdin;
1	SESU_AE_FBA_ECM_REG_LESCWI_ENG	LESC	t
2	SESU_AE_FBA_ECM_REG_LESC_ENG	LESC	t
3	SESU_AE_MAT_ECM_REG_LESCWI_ENG	LESC	t
4	SESU_AE_MAT_ECM_REG_LESC_ENG	LESC	t
5	SESU_AU_FBA_ECM_REG_LESCWI_ENG	LESC	t
6	SESU_AU_FBA_ECM_REG_LESC_CNCN_ILAC	LESC	t
7	SESU_AU_FBA_ECM_REG_LESC_ENG	LESC	t
8	SESU_AU_MAT_ECM_REG_LESCWI_ENG	LESC	t
9	SESU_AU_MAT_ECM_REG_LESC_CNCN	LESC	t
10	SESU_AU_MAT_ECM_REG_LESC_ENG	LESC	t
11	SESU_BR_FBA_ECM_REG_LESCWI_ENG	LESC	t
12	SESU_BR_FBA_ECM_REG_LESC_ENG	LESC	t
13	SESU_BR_MAT_ECM_REG_LESCWI_ENG	LESC	t
14	SESU_BR_MAT_ECM_REG_LESC_ENG	LESC	t
15	SESU_EG_FBA_ECM_REG_LESCWI_ENG	LESC	t
16	SESU_EG_FBA_ECM_REG_LESC_ENG	LESC	t
17	SESU_EG_MAT_ECM_REG_LESCWI_ENG	LESC	t
18	SESU_EG_MAT_ECM_REG_LESC_ENG	LESC	t
19	SESU_EU_FBA_ECM_REG_LESCWI_ENG	LESC	t
20	SESU_EU_FBA_ECM_REG_LESC_ENG	LESC	t
21	SESU_EU_MAT_ECM_REG_LESCWI_ENG	LESC	t
22	SESU_EU_MAT_ECM_REG_LESC_CNCN	LESC	t
23	SESU_EU_MAT_ECM_REG_LESC_ENG	LESC	t
24	SESU_EU_MAT_ECM_REG_STD_ENG_SDFR	LESC	t
25	SESU_FE_MAT_ECM_REG_STD_ENG_SDFR	LESC	t
26	SESU_IN_MAT_ECM_REG_LESCWI_ENG	LESC	t
27	SESU_IN_MAT_ECM_REG_LESC_ENG	LESC	t
28	SESU_IN_MAT_ECM_REG_STD_ENG_SDFR	LESC	t
29	SESU_JP_MAT_ECM_REG_LESC_CNCN	LESC	t
30	SESU_JP_MAT_ECM_REG_LESC_JPN	LESC	t
31	SESU_MX_FBA_ECM_REG_LESCWI_ENG	LESC	t
32	SESU_MX_FBA_ECM_REG_LESC_ENG	LESC	t
33	SESU_MX_MAT_ECM_REG_LESCWI_ENG	LESC	t
34	SESU_MX_MAT_ECM_REG_LESC_ENG	LESC	t
35	SESU_NAAE_LESC_ECM_911_CH_ENGLISH_ME-FBA	LESC	t
36	SESU_NAAE_LESC_ECM_911_CH_ENGLISH_ME-MAT	LESC	t
37	SESU_NAAE_LESC_ECM_REG_CH_ENGLISH_ME-FBA	LESC	t
38	SESU_NAAE_LESC_ECM_REG_CH_ENGLISH_ME-MAT	LESC	t
39	SESU_NAAU_LESC_ECM_REG_CH_CN-CHINESE_AU-ILAC	LESC	t
40	SESU_NAAU_LESC_ECM_REG_CH_CN-CHINESE_AU-MAT	LESC	t
41	SESU_NAAU_LESC_ECM_REG_CH_CN-CHINESE_MAT	LESC	t
42	SESU_NAAU_LESC_ECM_REG_CH_ENGLISH_AUSG-FBA	LESC	t
43	SESU_NAAU_LESC_ECM_REG_CH_ENGLISH_AUSG-MAT	LESC	t
44	SESU_NABR_LESC_ECM_911_CH_ENGLISH_BR-FBA	LESC	t
45	SESU_NABR_LESC_ECM_911_CH_ENGLISH_BR-MAT	LESC	t
46	SESU_NABR_LESC_ECM_REG_CH_ENGLISH_BR-FBA	LESC	t
47	SESU_NABR_LESC_ECM_REG_CH_ENGLISH_BR-MAT	LESC	t
48	SESU_NABR_LESC_ECM_VIP_CH_ENGLISH_BR-FBA	LESC	t
49	SESU_NABR_LESC_ECM_VIP_CH_ENGLISH_BR-MAT	LESC	t
50	SESU_NAEG_LESC_ECM_911_CH_ENGLISH_ME-MAT	LESC	t
51	SESU_NAEG_LESC_ECM_REG_CH_ENGLISH_ME-FBA	LESC	t
52	SESU_NAEG_LESC_ECM_REG_CH_ENGLISH_ME-MAT	LESC	t
53	SESU_NAIN_LESC_ECM_911_CH_ENGLISH_IN-MAT	LESC	t
54	SESU_NAIN_LESC_ECM_911_CH_ENGLISH_IN-SDFR	LESC	t
55	SESU_NAIN_LESC_ECM_REG_CH_ENGLISH_IN-MAT	LESC	t
56	SESU_NAIN_LESC_ECM_REG_CH_ENGLISH_IN-SDFR	LESC	t
57	SESU_NAJP_LESC_ECM_911_CH_CN-CHINESE_JP-MAT	LESC	t
58	SESU_NAJP_LESC_ECM_911_CH_CN-CHINESE_MAT	LESC	t
59	SESU_NAJP_LESC_ECM_REG_CH_CN-CHINESE_JP-MAT	LESC	t
60	SESU_NAJP_LESC_ECM_REG_CH_CN-CHINESE_MAT	LESC	t
61	SESU_NAJP_LESC_ECM_REG_CH_ENGLISH_JP-SDFR	LESC	t
62	SESU_NAMX_LESC_ECM_911_CH_ENGLISH_MX-FBA	LESC	t
63	SESU_NAMX_LESC_ECM_911_CH_ENGLISH_MX-MAT	LESC	t
64	SESU_NAMX_LESC_ECM_REG_CH_ENGLISH_MX-FBA	LESC	t
65	SESU_NAMX_LESC_ECM_REG_CH_ENGLISH_MX-MAT	LESC	t
66	SESU_NAMX_LESC_ECM_VIP_CH_ENGLISH_MX-FBA	LESC	t
67	SESU_NAMX_LESC_ECM_VIP_CH_ENGLISH_MX-MAT	LESC	t
68	SESU_NASA_LESC_ECM_911_CH_ENGLISH_ME-MAT	LESC	t
69	SESU_NASA_LESC_ECM_REG_CH_ENGLISH_ME-FBA	LESC	t
70	SESU_NASA_LESC_ECM_REG_CH_ENGLISH_ME-MAT	LESC	t
71	SESU_NASA_LESC_ECM_VIP_CH_ENGLISH_ME-FBA	LESC	t
72	SESU_NASG_LESC_ECM_REG_CH_ENGLISH_AUSG-FBA	LESC	t
73	SESU_NASG_LESC_ECM_REG_CH_ENGLISH_AUSG-MAT	LESC	t
74	SESU_NAUK_LESC_ECM_911_CH_CN-CHINESE_MAT	LESC	t
75	SESU_NAUK_LESC_ECM_911_CH_CN-CHINESE_UK-MAT	LESC	t
76	SESU_NAUK_LESC_ECM_911_CH_ENGLISH_EU-SDFR	LESC	t
77	SESU_NAUK_LESC_ECM_911_CH_ENGLISH_EU5-FBA	LESC	t
78	SESU_NAUK_LESC_ECM_911_CH_ENGLISH_EU5-MAT	LESC	t
79	SESU_NAUK_LESC_ECM_REG_CH_CN-CHINESE_MAT	LESC	t
80	SESU_NAUK_LESC_ECM_REG_CH_CN-CHINESE_UK-MAT	LESC	t
81	SESU_NAUK_LESC_ECM_REG_CH_ENGLISH_EU-SDFR	LESC	t
82	SESU_NAUK_LESC_ECM_REG_CH_ENGLISH_EU5-FBA	LESC	t
83	SESU_NAUK_LESC_ECM_REG_CH_ENGLISH_EU5-MAT	LESC	t
84	SESU_NAUK_LESC_ECM_V911_CH_CN-CHINESE_MAT	LESC	t
85	SESU_NAUK_LESC_ECM_V911_CH_CN-CHINESE_UK-MAT	LESC	t
86	SESU_NAUK_LESC_ECM_V911_CH_ENGLISH_EU5-FBA	LESC	t
87	SESU_NAUK_LESC_ECM_V911_CH_ENGLISH_EU5-MAT	LESC	t
88	SESU_NAUK_LESC_ECM_VIP_CH_CN-CHINESE_MAT	LESC	t
89	SESU_NAUK_LESC_ECM_VIP_CH_CN-CHINESE_UK-MAT	LESC	t
90	SESU_NAUK_LESC_ECM_VIP_CH_ENGLISH_EU-SDFR	LESC	t
91	SESU_NAUK_LESC_ECM_VIP_CH_ENGLISH_EU5-FBA	LESC	t
92	SESU_NAUK_LESC_ECM_VIP_CH_ENGLISH_EU5-MAT	LESC	t
93	SESU_NAUS_LESC_ECM_911_CH_CN-CHINESE_MAT	LESC	t
94	SESU_NAUS_LESC_ECM_911_CH_ENGLISH_NA-FBA	LESC	t
95	SESU_NAUS_LESC_ECM_911_CH_ENGLISH_NA-MAT	LESC	t
96	SESU_NAUS_LESC_ECM_911_CH_ENGLISH_NA-SDFR	LESC	t
97	SESU_NAUS_LESC_ECM_REG_CH_CN-CHINESE_MAT	LESC	t
98	SESU_NAUS_LESC_ECM_REG_CH_ENGLISH_NA-FBA	LESC	t
99	SESU_NAUS_LESC_ECM_REG_CH_ENGLISH_NA-MAT	LESC	t
100	SESU_NAUS_LESC_ECM_REG_CH_ENGLISH_NA-SDFR	LESC	t
101	SESU_NAUS_LESC_ECM_V911_CH_CN-CHINESE_MAT	LESC	t
102	SESU_NAUS_LESC_ECM_V911_CH_ENGLISH_NA-FBA	LESC	t
103	SESU_NAUS_LESC_ECM_V911_CH_ENGLISH_NA-MAT	LESC	t
104	SESU_NAUS_LESC_ECM_V911_CH_ENGLISH_NA-SDFR	LESC	t
105	SESU_NAUS_LESC_ECM_VIP_CH_CN-CHINESE_MAT	LESC	t
106	SESU_NAUS_LESC_ECM_VIP_CH_ENGLISH_NA-FBA	LESC	t
107	SESU_NAUS_LESC_ECM_VIP_CH_ENGLISH_NA-MAT	LESC	t
108	SESU_NAUS_LESC_PCM_911_CH_ENGLISH_NA-FBA	LESC	t
109	SESU_NAUS_LESC_PCM_911_CH_ENGLISH_NA-MAT	LESC	t
110	SESU_NAUS_LESC_PCM_REG_CH_ENGLISH_NA-FBA	LESC	t
111	SESU_NAUS_LESC_PCM_REG_CH_ENGLISH_NA-MAT	LESC	t
112	SESU_NAUS_LESC_PCM_V911_CH_ENGLISH_NA-FBA	LESC	t
113	SESU_NAUS_LESC_PCM_V911_CH_ENGLISH_NA-MAT	LESC	t
114	SESU_NAUS_LESC_PCM_VIP_CH_ENGLISH_NA-FBA	LESC	t
115	SESU_NAUS_LESC_PCM_VIP_CH_ENGLISH_NA-MAT	LESC	t
116	SESU_NA_FBA_ECM_REG_LESCWI_ENG	LESC	t
117	SESU_NA_FBA_ECM_REG_LESC_ENG	LESC	t
118	SESU_NA_FBA_PCM_REG_LESC_ENG	LESC	t
119	SESU_NA_LESC_ECM_REG_STD_ENG_HRO	LESC	t
120	SESU_NA_MAT_ECM_REG_LESCWI_ENG	LESC	t
121	SESU_NA_MAT_ECM_REG_LESC_CNCN	LESC	t
122	SESU_NA_MAT_ECM_REG_LESC_ENG	LESC	t
123	SESU_NA_MAT_ECM_REG_STD_ENG_SDFR	LESC	t
124	SESU_NA_MAT_PCM_REG_LESC_ENG	LESC	t
125	SESU_SA_FBA_ECM_REG_LESCWI_ENG	LESC	t
126	SESU_SA_FBA_ECM_REG_LESC_ENG	LESC	t
127	SESU_SA_MAT_ECM_REG_LESCWI_ENG	LESC	t
128	SESU_SA_MAT_ECM_REG_LESC_ENG	LESC	t
129	SESU_SG_FBA_ECM_REG_LESCWI_ENG	LESC	t
130	SESU_SG_FBA_ECM_REG_LESC_ENG	LESC	t
131	SESU_SG_MAT_ECM_REG_LESCWI_ENG	LESC	t
132	SESU_SG_MAT_ECM_REG_LESC_ENG	LESC	t
\.


--
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.team_members (id, employee_id, name, email, user_id, role, join_date, shift_start, shift_end, photo_url, phone, level, country, country_code, supports_marketplace, skillset, is_active, created_at, updated_at) FROM stdin;
5	bsathyan	Bharat Sathyanarayanan	bsathyan@amazon.com	5	Specialist	\N	\N	\N	\N	\N	L4	\N	\N	\N	\N	f	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
1	narotem	Mounika Narote	narotem@amazon.com	1	Team Manager	\N	\N	\N	/team-photos/narotem.jpeg	8446363782	L4	\N	\N	NA. IN	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
2	shajamri	Amrit Shaji	shajamri@amazon.com	2	Specialist	\N	\N	\N	/team-photos/shajamri.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
3	arurmn	Arun Kumar R	arurmn@amazon.com	3	Specialist	\N	\N	\N	/team-photos/arurmn.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
4	darunkuv	Arunkumar V	darunkuv@amazon.com	4	Specialist	\N	\N	\N	/team-photos/darunkuv.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
6	hulman	Darshan Hulmani	hulman@amazon.com	6	Specialist	\N	\N	\N	/team-photos/hulman.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
7	gujagann	Jagannath Ghosh	gujagann@amazon.com	7	Specialist	\N	\N	\N	/team-photos/gujagann.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
8	jibiadas	Jibitesh Das	jibiadas@amazon.com	8	Specialist	\N	\N	\N	/team-photos/jibiadas.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
9	jmadhum	Madhumathi J	jmadhum@amazon.com	9	Specialist	\N	\N	\N	/team-photos/jmadhum.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
10	fmehru	Mehruf Faizal	fmehru@amazon.com	10	Specialist	\N	\N	\N	/team-photos/fmehru.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
11	gargnoo	Noopur Garg	gargnoo@amazon.com	11	Specialist	\N	\N	\N	/team-photos/gargnoo.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
12	bhaskpri	PRIYANKA BHASKARAN	bhaskpri@amazon.com	12	Specialist	\N	\N	\N	/uploads/profiles/132_bhaskpri.jpeg	9876543210	L4	\N	\N	NA, IN, FE	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
13	rpradeev	Pradeep R	rpradeev@amazon.com	13	Specialist	\N	\N	\N	/team-photos/rpradeev.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
14	pparwar	Pragya Parwar	pparwar@amazon.com	14	Specialist	\N	\N	\N	/team-photos/pparwar.jpeg	8982922771	L4	\N	\N	IN, NA, AU,FE	FBA, M@, IIDP,FEED	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
15	mrssll	Rasselle Malvar	mrssll@amazon.com	15	Specialist	\N	\N	\N	/team-photos/mrssll.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
16	sayarim	SAYARI MONDAL	sayarim@amazon.com	16	Specialist	\N	\N	\N	/team-photos/sayarim.jpeg	1234567890	L4	\N	\N	IN, NA	FBA, M@,IIDP,FEEDs	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
17	somsajiv	Sajiv Soman	somsajiv@amazon.com	17	Specialist	\N	\N	\N	/team-photos/somsajiv.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
18	sekumarz	Senthil Kumar	sekumarz@amazon.com	18	Specialist	\N	\N	\N	/team-photos/sekumarz.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
19	sshabnam	Shabnam .	sshabnam@amazon.com	19	Specialist	\N	\N	\N	/team-photos/sshabnam.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
20	datathag	Tathagata Das	datathag@amazon.com	20	Specialist	\N	\N	\N	/team-photos/datathag.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
21	anjuumai	Umaid Anjum	anjuumai@amazon.com	21	Specialist	\N	\N	\N	/team-photos/anjuumai.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
22	mishrary	Yogesh Mishra	mishrary@amazon.com	22	Specialist	\N	\N	\N	/team-photos/mishrary.jpeg	\N	L4	\N	\N	\N	\N	t	2026-03-11 17:02:27.894542+00	2026-03-11 17:02:27.894542+00
\.


--
-- Data for Name: upcoming_leaves; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.upcoming_leaves (id, user_id, leave_date, end_date, leave_type, reason, is_announced, is_processed, created_at) FROM stdin;
1	14	2026-02-19	\N	sick	Sick	t	t	2026-02-18 07:51:20.924733+00
2	14	2026-02-20	\N	annual	Vacationing	t	t	2026-02-19 10:50:41.116494+00
3	14	2026-02-24	2026-02-27	annual	vacation	t	t	2026-02-23 09:06:54.755722+00
4	14	2026-03-12	2026-02-12	casual		t	f	2026-02-24 04:56:00.671633+00
5	16	2026-03-12	2026-03-14	casual		t	f	2026-02-24 05:48:09.332096+00
10	16	2026-02-28	2026-02-28	casual		t	t	2026-02-24 02:59:55.815363+00
11	14	2026-04-27	2026-03-09	annual	vacation	t	f	2026-03-02 07:45:17.194383+00
12	14	2026-03-05	2026-02-06	annual		t	t	2026-02-24 04:53:52.736167+00
13	14	2026-03-25	2026-03-27	annual	vacation	t	f	2026-03-09 23:20:13.349479+00
14	14	2026-03-11	2026-03-11	sick	Out sick	t	t	2026-03-11 05:35:20.379041+00
15	12	2026-03-11	2026-03-11	sick		t	t	2026-03-11 08:05:01.160324+00
16	16	2026-03-11	2026-03-11	casual		t	t	2026-03-11 08:06:17.108565+00
18	1	2026-03-16	2026-03-19	annual	Business tour	t	f	2026-03-12 10:57:28.167028+00
20	14	2026-03-20	2026-03-20	annual		t	f	2026-03-12 11:47:30.338006+00
23	1	2026-03-20	2026-03-20	other	Job Tour	t	f	2026-03-12 13:22:54.607682+00
22	14	2026-03-17	2026-03-17	casual		t	f	2026-03-12 11:49:51.700102+00
24	16	2026-03-20	2026-03-20	annual		t	f	2026-03-12 13:47:39.464931+00
25	14	2026-03-12	2026-03-12	sick	out sick	t	f	2026-03-12 14:41:02.449128+00
26	1	2026-03-27	2026-03-27	annual		t	f	2026-03-12 15:24:03.62627+00
27	14	2026-03-28	2026-03-28	casual		t	f	2026-03-13 05:29:31.95544+00
28	14	2026-04-01	2026-04-03	annual		t	f	2026-03-13 08:35:03.347784+00
\.


--
-- Data for Name: user_skills; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.user_skills (id, user_id, skill_id) FROM stdin;
5	14	26
6	14	27
7	14	28
14	16	2
15	16	3
16	16	5
17	16	6
558	1	26
559	1	27
560	1	28
561	1	116
562	1	117
563	1	118
564	1	119
565	1	120
566	1	121
567	1	122
568	1	123
569	1	124
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.users (id, login, email, name, hashed_password, previous_password, employee_id, marketplace, contact_number, level, manager_login, team_name, location, supports_marketplace, skill_set, role, profile_picture, date_of_birth, shift_start, shift_end, week_off, is_email_verified, is_active, is_approved, created_at, updated_at, total_tenure) FROM stdin;
2	shajamri	shajamri@amazon.com	Amrit Shaji	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	102523859	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(KA,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/shajamri.jpeg	\N	05:30	14:30	0,1	t	t	t	2017-09-04 00:00:00+00	2026-03-14 06:24:20.002035+00	8 years, 6 months, 8 days
3	arurmn	arurmn@amazon.com	Arun Kumar R	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	107384833	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(TN,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/arurmn.jpeg	\N	\N	\N	\N	t	t	t	2020-07-27 00:00:00+00	2026-03-14 06:24:20.002035+00	5 years, 7 months, 13 days
5	bsathyan	bsathyan@amazon.com	Bharat Sathyanarayanan	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	bsathyan	IN	\N	L4	narotem	LESC	\N	\N	\N	specialist	\N	\N	15:00	00:00	0,6	t	f	t	2026-03-11 17:02:12.273261+00	2026-03-14 06:24:20.002035+00	\N
1	narotem	narotem@amazon.com	Mounika Narote	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	narotem	IN	8446363782	L4	shangy	LESC	Virtual, IN, KA	NA. IN	\N	manager	/team-photos/narotem.jpeg	15-09	10:30	19:30	6,0	t	t	t	2026-03-11 17:02:12.273261+00	2026-04-18 04:47:09.134357+00	\N
4	darunkuv	darunkuv@amazon.com	Arunkumar V	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112205163	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(TN,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/darunkuv.jpeg	\N	07:30	16:30	5,6	t	t	t	2022-02-14 00:00:00+00	2026-03-14 06:24:20.002035+00	4 years, 26 days
6	hulman	hulman@amazon.com	Darshan Hulmani	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	109694999	IN	\N	L4	narotem	LESC	Virtual Contact Center(KA,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/hulman.jpeg	\N	07:00	16:00	0,6	t	t	t	2021-05-03 00:00:00+00	2026-03-14 06:24:20.002035+00	4 years, 10 months, 9 days
7	gujagann	gujagann@amazon.com	Jagannath Ghosh	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112696369	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(WB,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/gujagann.jpeg	\N	07:30	16:30	3,4	t	t	t	2022-06-20 00:00:00+00	2026-03-14 06:24:20.002035+00	3 years, 8 months, 20 days
8	jibiadas	jibiadas@amazon.com	Jibitesh Das	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112403355	IN	\N	L4	narotem	LESC	Virtual Contact Center(KA,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/jibiadas.jpeg	\N	\N	\N	\N	t	t	t	2022-04-04 00:00:00+00	2026-03-14 06:24:20.002035+00	3 years, 11 months, 8 days
9	jmadhum	jmadhum@amazon.com	Madhumathi J	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	109179915	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(KA,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/jmadhum.jpeg	\N	07:30	16:30	0,1	t	t	t	2021-01-18 00:00:00+00	2026-03-14 06:24:20.002035+00	5 years, 1 month, 22 days
10	fmehru	fmehru@amazon.com	Mehruf Faizal	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	102044392	IN	\N	L4	narotem	LESC	VCCKL-VirtualLoc(Kochi,KL,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/fmehru.jpeg	\N	\N	\N	\N	t	t	t	2017-03-27 00:00:00+00	2026-03-14 06:24:20.002035+00	8 years, 11 months, 13 days
11	gargnoo	gargnoo@amazon.com	Noopur Garg	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112403401	IN	\N	L4	narotem	LESC	VirtualLocation-INDCrp(DEL,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/gargnoo.jpeg	\N	07:30	16:30	2,3	t	t	t	2022-04-04 00:00:00+00	2026-03-14 06:24:20.002035+00	3 years, 11 months, 8 days
12	bhaskpri	bhaskpri@amazon.com	PRIYANKA BHASKARAN	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	109843585	IN	9876543210	L4	narotem	LESC	Virtual Location-INDCrp(KA,IN) (UTC +05:30)	NA, IN, FE	\N	specialist	/uploads/profiles/132_bhaskpri.jpeg	25-05	06:30	15:30	5,6	t	t	t	2021-05-24 00:00:00+00	2026-03-14 06:24:20.002035+00	4 years, 9 months, 16 days
13	rpradeev	rpradeev@amazon.com	Pradeep R	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	110533428	IN	\N	L4	narotem	LESC	Virtual Contact Center(KA,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/rpradeev.jpeg	\N	\N	\N	\N	t	t	t	2021-08-23 00:00:00+00	2026-03-14 06:24:20.002035+00	4 years, 6 months, 17 days
15	mrssll	mrssll@amazon.com	Rasselle Malvar	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	109357714	IN	\N	L4	narotem	LESC	Virtual ContactCtr-Philippines (UTC +08:00)	\N	\N	specialist	/team-photos/mrssll.jpeg	\N	\N	\N	\N	t	t	t	2021-02-22 00:00:00+00	2026-03-14 06:24:20.002035+00	5 years, 19 days
16	sayarim	sayarim@amazon.com	SAYARI MONDAL	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	104219766	IN	1234567890	L4	narotem	LESC	Virtual Location-INDCrp(TG,IN) (UTC +05:30)	IN, NA	FBA, M@,IIDP,FEEDs	specialist	/uploads/profiles/profile_16.jpeg	06-06	06:30	15:30	0,1	t	t	t	2018-12-31 00:00:00+00	2026-03-14 06:24:20.002035+00	7 years, 2 months, 9 days
17	somsajiv	somsajiv@amazon.com	Sajiv Soman	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	107798791	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(TN,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/somsajiv.jpeg	\N	11:30	20:30	5,6	t	t	t	2020-09-07 00:00:00+00	2026-03-14 06:24:20.002035+00	5 years, 6 months, 5 days
19	sshabnam	sshabnam@amazon.com	Shabnam .	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	101194106	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(KA,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/sshabnam.jpeg	\N	05:30	14:30	0,1	t	t	t	2016-05-09 00:00:00+00	2026-03-14 06:24:20.002035+00	9 years, 10 months, 3 days
18	sekumarz	sekumarz@amazon.com	Senthil Kumar	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	105149960	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(TN,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/sekumarz.jpeg	\N	\N	\N	\N	t	t	t	2020-09-07 00:00:00+00	2026-03-14 06:24:20.002035+00	6 years, 5 months, 1 day
20	datathag	datathag@amazon.com	Tathagata Das	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112304725	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(WB,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/datathag.jpeg	\N	14:30	23:30	0,1	t	t	t	2022-03-07 00:00:00+00	2026-03-14 06:24:20.002035+00	4 years, 5 days
21	anjuumai	anjuumai@amazon.com	Umaid Anjum	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112552580	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(WB,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/anjuumai.jpeg	\N	05:30	14:30	5,6	t	t	t	2022-05-16 00:00:00+00	2026-03-14 06:24:20.002035+00	3 years, 9 months, 24 days
22	mishrary	mishrary@amazon.com	Yogesh Mishra	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	112916074	IN	\N	L4	narotem	LESC	Virtual Location-INDCrp(WB,IN) (UTC +05:30)	\N	\N	specialist	/team-photos/mishrary.jpeg	\N	\N	\N	\N	t	t	t	2022-08-16 00:00:00+00	2026-03-14 06:24:20.002035+00	3 years, 6 months, 24 days
14	pparwar	pparwar@amazon.com	Pragya Parwar	$2b$12$nKaGJBl6aS68baJHehoXyu5s3jVF8MG751nhnM3zq3XO13XubAUNi	\N	108064064	IN	8982922771	L4	narotem	LESC	Virtual Location-INDCrp(MH,IN) (UTC +05:30)	IN, NA, AU,FE	FBA, M@, IIDP,FEED	specialist	/uploads/profiles/profile_14.jpeg	10-03	09:30	18:30	0,1	t	t	t	2022-01-10 00:00:00+00	2026-04-17 14:06:45.241672+00	4 years, 2 months, 2 days
\.


--
-- Data for Name: wall_comments; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.wall_comments (id, post_id, user_id, content, created_at) FROM stdin;
1	7	14	Happy Birthday	2026-03-12 11:54:00.965956
\.


--
-- Data for Name: wall_posts; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.wall_posts (id, user_id, post_type, content, emoji, gif_url, badge, recipient_ids, leadership_principles, week_number, year, image_url, is_pinned, created_at) FROM stdin;
1	19	top_performer	🏆 Congratulations to our Top 1 performer of Week 10! Shabnam . scored an incredible 86.7%! Keep shining! ⭐	🏆	\N	\N	\N	\N	10	2026	\N	t	2026-03-07 21:10:11.768267
2	9	top_performer	🌟 Week 10 Star Alert! Madhumathi J clinched #2 with 85.2%! The team is proud of you! 💪	🥈	\N	\N	\N	\N	10	2026	\N	f	2026-03-07 21:10:11.768283
3	6	top_performer	🏆 Congratulations to our Top 3 performer of Week 10! Darshan Hulmani scored an incredible 84.9%! Keep shining! ⭐	🥉	\N	\N	\N	\N	10	2026	\N	f	2026-03-07 21:10:11.768291
4	1	user	Hi All	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-08 05:33:56.629422
5	1	birthday	🎂🎉 Happy Birthday, PRIYANKA BHASKARAN! 🥳 Wishing you an amazing year ahead filled with success and happiness! 🎈🎁	🎂	\N	\N	\N	\N	\N	\N	\N	f	2026-03-11 10:53:40.328018
6	1	top_performer	🏆 Top 3 Performers — Week 10\n🥇 Shabnam . (86.7%)  🥈 Madhumathi J (85.2%)  🥉 Darshan Hulmani (84.9%)	🏆	\N	\N	\N	\N	\N	\N	/uploads/wall/7b3619140d3f4a34a9cd4e99ada370b8.png	f	2026-03-11 14:14:16.965831
7	1	birthday	🎂🎉 Happy Birthday, PRIYANKA BHASKARAN! 🥳 Wishing you an amazing year ahead filled with success and happiness! 🎈🎁	🎂	\N	\N	\N	\N	\N	\N	\N	f	2026-03-11 14:14:43.896877
\.


--
-- Data for Name: wall_reactions; Type: TABLE DATA; Schema: public; Owner: pulseboard_admin
--

COPY public.wall_reactions (id, post_id, user_id, reaction, created_at) FROM stdin;
1	2	1	❤️	2026-03-07 21:10:34.381016
2	3	1	👍	2026-03-07 21:10:40.408349
3	1	1	🎉	2026-03-07 21:10:43.866936
4	1	14	❤️	2026-03-09 22:54:37.626383
\.


--
-- Name: file_uploads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.file_uploads_id_seq', 12, true);


--
-- Name: leave_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.leave_submissions_id_seq', 41, true);


--
-- Name: member_performance_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.member_performance_metrics_id_seq', 1071, true);


--
-- Name: metric_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.metric_files_id_seq', 7, true);


--
-- Name: metric_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.metric_goals_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.notifications_id_seq', 781, true);


--
-- Name: ot_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.ot_submissions_id_seq', 24, true);


--
-- Name: poll_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.poll_options_id_seq', 7, true);


--
-- Name: poll_votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.poll_votes_id_seq', 8, true);


--
-- Name: polls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.polls_id_seq', 3, true);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.skills_id_seq', 132, true);


--
-- Name: team_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.team_members_id_seq', 22, true);


--
-- Name: upcoming_leaves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.upcoming_leaves_id_seq', 28, true);


--
-- Name: user_skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.user_skills_id_seq', 569, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 22, true);


--
-- Name: wall_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.wall_comments_id_seq', 1, true);


--
-- Name: wall_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.wall_posts_id_seq', 7, true);


--
-- Name: wall_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pulseboard_admin
--

SELECT pg_catalog.setval('public.wall_reactions_id_seq', 4, true);


--
-- Name: file_uploads file_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_pkey PRIMARY KEY (id);


--
-- Name: leave_submissions leave_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.leave_submissions
    ADD CONSTRAINT leave_submissions_pkey PRIMARY KEY (id);


--
-- Name: member_performance_metrics member_performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.member_performance_metrics
    ADD CONSTRAINT member_performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: metric_files metric_files_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.metric_files
    ADD CONSTRAINT metric_files_pkey PRIMARY KEY (id);


--
-- Name: metric_goals metric_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.metric_goals
    ADD CONSTRAINT metric_goals_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ot_submissions ot_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.ot_submissions
    ADD CONSTRAINT ot_submissions_pkey PRIMARY KEY (id);


--
-- Name: poll_options poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_pkey PRIMARY KEY (id);


--
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- Name: polls polls_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: skills skills_skill_code_key; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_skill_code_key UNIQUE (skill_code);


--
-- Name: team_members team_members_email_key; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_email_key UNIQUE (email);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: upcoming_leaves upcoming_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.upcoming_leaves
    ADD CONSTRAINT upcoming_leaves_pkey PRIMARY KEY (id);


--
-- Name: user_skills user_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_pkey PRIMARY KEY (id);


--
-- Name: user_skills user_skills_user_id_skill_id_key; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_user_id_skill_id_key UNIQUE (user_id, skill_id);


--
-- Name: users users_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wall_comments wall_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_comments
    ADD CONSTRAINT wall_comments_pkey PRIMARY KEY (id);


--
-- Name: wall_posts wall_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_posts
    ADD CONSTRAINT wall_posts_pkey PRIMARY KEY (id);


--
-- Name: wall_reactions wall_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_reactions
    ADD CONSTRAINT wall_reactions_pkey PRIMARY KEY (id);


--
-- Name: ix_file_uploads_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_file_uploads_id ON public.file_uploads USING btree (id);


--
-- Name: ix_leave_submissions_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_leave_submissions_id ON public.leave_submissions USING btree (id);


--
-- Name: ix_metric_files_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_metric_files_id ON public.metric_files USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_ot_submissions_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_ot_submissions_id ON public.ot_submissions USING btree (id);


--
-- Name: ix_poll_options_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_poll_options_id ON public.poll_options USING btree (id);


--
-- Name: ix_poll_votes_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_poll_votes_id ON public.poll_votes USING btree (id);


--
-- Name: ix_polls_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_polls_id ON public.polls USING btree (id);


--
-- Name: ix_skills_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_skills_id ON public.skills USING btree (id);


--
-- Name: ix_team_members_employee_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE UNIQUE INDEX ix_team_members_employee_id ON public.team_members USING btree (employee_id);


--
-- Name: ix_team_members_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_team_members_id ON public.team_members USING btree (id);


--
-- Name: ix_upcoming_leaves_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_upcoming_leaves_id ON public.upcoming_leaves USING btree (id);


--
-- Name: ix_user_skills_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_user_skills_id ON public.user_skills USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_login; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE UNIQUE INDEX ix_users_login ON public.users USING btree (login);


--
-- Name: ix_wall_comments_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_wall_comments_id ON public.wall_comments USING btree (id);


--
-- Name: ix_wall_posts_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_wall_posts_id ON public.wall_posts USING btree (id);


--
-- Name: ix_wall_reactions_id; Type: INDEX; Schema: public; Owner: pulseboard_admin
--

CREATE INDEX ix_wall_reactions_id ON public.wall_reactions USING btree (id);


--
-- Name: file_uploads file_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.file_uploads
    ADD CONSTRAINT file_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: leave_submissions leave_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.leave_submissions
    ADD CONSTRAINT leave_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: member_performance_metrics member_performance_metrics_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.member_performance_metrics
    ADD CONSTRAINT member_performance_metrics_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.team_members(id);


--
-- Name: metric_files metric_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.metric_files
    ADD CONSTRAINT metric_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ot_submissions ot_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.ot_submissions
    ADD CONSTRAINT ot_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: poll_options poll_options_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id);


--
-- Name: poll_votes poll_votes_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.poll_options(id);


--
-- Name: poll_votes poll_votes_poll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES public.polls(id);


--
-- Name: poll_votes poll_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: polls polls_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: upcoming_leaves upcoming_leaves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.upcoming_leaves
    ADD CONSTRAINT upcoming_leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_skills user_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: user_skills user_skills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wall_comments wall_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_comments
    ADD CONSTRAINT wall_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.wall_posts(id);


--
-- Name: wall_comments wall_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_comments
    ADD CONSTRAINT wall_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wall_posts wall_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_posts
    ADD CONSTRAINT wall_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wall_reactions wall_reactions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_reactions
    ADD CONSTRAINT wall_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.wall_posts(id);


--
-- Name: wall_reactions wall_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pulseboard_admin
--

ALTER TABLE ONLY public.wall_reactions
    ADD CONSTRAINT wall_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pulseboard_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict XdGsN9C5B6ySa9SQAjMX4SQPyHsMLAOAyFJavKXpm9mEbgcZp15hbLOtn8I7qc5

