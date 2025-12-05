--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-12-05 01:36:19 CST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE planeacion;
--
-- TOC entry 4095 (class 1262 OID 16470)
-- Name: planeacion; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE planeacion WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'es_MX.UTF-8';


ALTER DATABASE planeacion OWNER TO postgres;

\connect planeacion

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 856 (class 1247 OID 16479)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'profesor'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 221 (class 1255 OID 16483)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16472)
-- Name: unidades_academicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unidades_academicas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    abreviatura character varying(50)
);


ALTER TABLE public.unidades_academicas OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16471)
-- Name: unidades_academicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unidades_academicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unidades_academicas_id_seq OWNER TO postgres;

--
-- TOC entry 4096 (class 0 OID 0)
-- Dependencies: 217
-- Name: unidades_academicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unidades_academicas_id_seq OWNED BY public.unidades_academicas.id;


--
-- TOC entry 220 (class 1259 OID 16485)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    unidad_id integer NOT NULL,
    nombre_completo character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'profesor'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16484)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 4097 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 3925 (class 2604 OID 16475)
-- Name: unidades_academicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_academicas ALTER COLUMN id SET DEFAULT nextval('public.unidades_academicas_id_seq'::regclass);


--
-- TOC entry 3926 (class 2604 OID 16488)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4087 (class 0 OID 16472)
-- Dependencies: 218
-- Data for Name: unidades_academicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unidades_academicas (id, nombre, abreviatura) FROM stdin;
1	Escuela Superior de Ingeniería Mecánica y Eléctrica - Unidad Zacatenco	ESIME Z
2	Escuela Superior de Cómputo	ESCOM
\.


--
-- TOC entry 4089 (class 0 OID 16485)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, unidad_id, nombre_completo, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
10	1	Prueba Profesor	prueba@ipn.mx	$2a$10$c77ep5H2xSI..6V5u8LXkuiLd4CnZYPEJNfJObSYVv4X/CwYuQrNK	profesor	t	2025-12-04 23:39:20.336723-06	2025-12-04 23:39:20.336723-06
11	2	Vidal Salazar Sánchez	vsalazars@ipn.mx	$2a$10$UoHenJfhWH0F9lAziMSrjuNBjN723ZAut/SPPkijTCRhNlxezLBAG	profesor	t	2025-12-04 23:44:56.811287-06	2025-12-04 23:44:56.811287-06
\.


--
-- TOC entry 4098 (class 0 OID 0)
-- Dependencies: 217
-- Name: unidades_academicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unidades_academicas_id_seq', 2, true);


--
-- TOC entry 4099 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 11, true);


--
-- TOC entry 3932 (class 2606 OID 16477)
-- Name: unidades_academicas unidades_academicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_academicas
    ADD CONSTRAINT unidades_academicas_pkey PRIMARY KEY (id);


--
-- TOC entry 3936 (class 2606 OID 16498)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 3938 (class 2606 OID 16496)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3933 (class 1259 OID 16506)
-- Name: idx_usuarios_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role);


--
-- TOC entry 3934 (class 1259 OID 16505)
-- Name: idx_usuarios_unidad_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_unidad_id ON public.usuarios USING btree (unidad_id);


--
-- TOC entry 3940 (class 2620 OID 16507)
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 3939 (class 2606 OID 16499)
-- Name: usuarios usuarios_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades_academicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2025-12-05 01:36:20 CST

--
-- PostgreSQL database dump complete
--

