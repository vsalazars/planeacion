--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

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
-- Name: planeacion_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.planeacion_status AS ENUM (
    'borrador',
    'en_progreso',
    'finalizada',
    'archivada'
);


ALTER TYPE public.planeacion_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'profesor'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
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
-- Name: planeacion_datos_generales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planeacion_datos_generales (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    asignatura character varying(255),
    periodo character varying(50),
    grupo character varying(50),
    proposito text,
    metodologia text,
    consideraciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fecha_elaboracion date,
    programa_academico character varying(255),
    plan_estudios_anio integer,
    semestre_nivel character varying(50),
    creditos_tepic numeric(5,2),
    creditos_satca numeric(5,2),
    grupos character varying(255),
    area_formacion character varying(100),
    modalidad character varying(50),
    semanas_por_semestre integer,
    sesiones_por_semestre integer,
    sesiones_aula integer,
    sesiones_laboratorio integer,
    sesiones_clinica integer,
    sesiones_otro integer,
    horas_teoria numeric(5,2),
    horas_practica numeric(5,2),
    horas_aula numeric(5,2),
    horas_laboratorio numeric(5,2),
    horas_clinica numeric(5,2),
    horas_otro numeric(5,2),
    horas_total numeric(5,2),
    docente_autor character varying(255)
);


ALTER TABLE public.planeacion_datos_generales OWNER TO postgres;

--
-- Name: planeacion_datos_generales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planeacion_datos_generales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planeacion_datos_generales_id_seq OWNER TO postgres;

--
-- Name: planeacion_datos_generales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planeacion_datos_generales_id_seq OWNED BY public.planeacion_datos_generales.id;


--
-- Name: planeacion_organizacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planeacion_organizacion (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    proposito text,
    estrategia text,
    metodos text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.planeacion_organizacion OWNER TO postgres;

--
-- Name: planeacion_organizacion_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planeacion_organizacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planeacion_organizacion_id_seq OWNER TO postgres;

--
-- Name: planeacion_organizacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planeacion_organizacion_id_seq OWNED BY public.planeacion_organizacion.id;


--
-- Name: planeacion_plagio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planeacion_plagio (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    acepta_plagio boolean DEFAULT false NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ithenticate boolean DEFAULT false NOT NULL,
    turnitin boolean DEFAULT false NOT NULL,
    otro text
);


ALTER TABLE public.planeacion_plagio OWNER TO postgres;

--
-- Name: planeacion_plagio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planeacion_plagio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planeacion_plagio_id_seq OWNER TO postgres;

--
-- Name: planeacion_plagio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planeacion_plagio_id_seq OWNED BY public.planeacion_plagio.id;


--
-- Name: planeacion_referencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planeacion_referencias (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    cita_apa text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unidades_aplica integer[],
    tipo character varying(30)
);


ALTER TABLE public.planeacion_referencias OWNER TO postgres;

--
-- Name: planeacion_referencias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planeacion_referencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planeacion_referencias_id_seq OWNER TO postgres;

--
-- Name: planeacion_referencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planeacion_referencias_id_seq OWNED BY public.planeacion_referencias.id;


--
-- Name: planeacion_relaciones_ejes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planeacion_relaciones_ejes (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    eje_disciplinar text,
    eje_transversal text,
    competencias text,
    resultados_aprendizaje text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    antecedentes text,
    laterales text,
    subsecuentes text,
    ejes_compromiso_social_sustentabilidad text,
    ejes_perspectiva_genero text,
    ejes_internacionalizacion text
);


ALTER TABLE public.planeacion_relaciones_ejes OWNER TO postgres;

--
-- Name: planeacion_relaciones_ejes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planeacion_relaciones_ejes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planeacion_relaciones_ejes_id_seq OWNER TO postgres;

--
-- Name: planeacion_relaciones_ejes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planeacion_relaciones_ejes_id_seq OWNED BY public.planeacion_relaciones_ejes.id;


--
-- Name: planeaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.planeaciones (
    id bigint NOT NULL,
    docente_id integer NOT NULL,
    unidad_academica_id integer NOT NULL,
    nombre_planeacion character varying(255) NOT NULL,
    asignatura character varying(255),
    periodo character varying(50),
    grupo character varying(50),
    status public.planeacion_status DEFAULT 'borrador'::public.planeacion_status NOT NULL,
    secciones_completas jsonb DEFAULT '{"datos": false, "plagio": false, "relaciones": false, "referencias": false, "organizacion": false}'::jsonb NOT NULL,
    finalizada_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.planeaciones OWNER TO postgres;

--
-- Name: planeaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.planeaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planeaciones_id_seq OWNER TO postgres;

--
-- Name: planeaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.planeaciones_id_seq OWNED BY public.planeaciones.id;


--
-- Name: sesiones_didacticas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesiones_didacticas (
    id bigint NOT NULL,
    unidad_tematica_id bigint NOT NULL,
    numero_sesion integer NOT NULL,
    temas_subtemas text,
    actividades text,
    valor_porcentual integer,
    evidencia text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    actividades_inicio text,
    actividades_desarrollo text,
    actividades_cierre text,
    recursos text[],
    evidencias text[],
    instrumentos text[]
);


ALTER TABLE public.sesiones_didacticas OWNER TO postgres;

--
-- Name: sesiones_didacticas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sesiones_didacticas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sesiones_didacticas_id_seq OWNER TO postgres;

--
-- Name: sesiones_didacticas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sesiones_didacticas_id_seq OWNED BY public.sesiones_didacticas.id;


--
-- Name: unidades_academicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unidades_academicas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    abreviatura character varying(50)
);


ALTER TABLE public.unidades_academicas OWNER TO postgres;

--
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
-- Name: unidades_academicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unidades_academicas_id_seq OWNED BY public.unidades_academicas.id;


--
-- Name: unidades_tematicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unidades_tematicas (
    id bigint NOT NULL,
    planeacion_id bigint NOT NULL,
    numero integer NOT NULL,
    nombre_unidad_tematica character varying(255) NOT NULL,
    horas integer,
    sesiones_por_espacio integer,
    sesiones_totales integer,
    porcentaje integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unidad_competencia text,
    periodo_del date,
    periodo_al date,
    horas_aula numeric(5,2),
    horas_laboratorio numeric(5,2),
    horas_taller numeric(5,2),
    horas_clinica numeric(5,2),
    horas_otro numeric(5,2),
    sesiones_aula integer,
    sesiones_laboratorio integer,
    sesiones_taller integer,
    sesiones_clinica integer,
    sesiones_otro integer,
    periodo_registro_eval character varying(100),
    aprendizajes_esperados text[],
    precisiones text
);


ALTER TABLE public.unidades_tematicas OWNER TO postgres;

--
-- Name: unidades_tematicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unidades_tematicas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unidades_tematicas_id_seq OWNER TO postgres;

--
-- Name: unidades_tematicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unidades_tematicas_id_seq OWNED BY public.unidades_tematicas.id;


--
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
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: planeacion_datos_generales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_datos_generales ALTER COLUMN id SET DEFAULT nextval('public.planeacion_datos_generales_id_seq'::regclass);


--
-- Name: planeacion_organizacion id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_organizacion ALTER COLUMN id SET DEFAULT nextval('public.planeacion_organizacion_id_seq'::regclass);


--
-- Name: planeacion_plagio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_plagio ALTER COLUMN id SET DEFAULT nextval('public.planeacion_plagio_id_seq'::regclass);


--
-- Name: planeacion_referencias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_referencias ALTER COLUMN id SET DEFAULT nextval('public.planeacion_referencias_id_seq'::regclass);


--
-- Name: planeacion_relaciones_ejes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_relaciones_ejes ALTER COLUMN id SET DEFAULT nextval('public.planeacion_relaciones_ejes_id_seq'::regclass);


--
-- Name: planeaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeaciones ALTER COLUMN id SET DEFAULT nextval('public.planeaciones_id_seq'::regclass);


--
-- Name: sesiones_didacticas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones_didacticas ALTER COLUMN id SET DEFAULT nextval('public.sesiones_didacticas_id_seq'::regclass);


--
-- Name: unidades_academicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_academicas ALTER COLUMN id SET DEFAULT nextval('public.unidades_academicas_id_seq'::regclass);


--
-- Name: unidades_tematicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_tematicas ALTER COLUMN id SET DEFAULT nextval('public.unidades_tematicas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: planeacion_datos_generales planeacion_datos_generales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_datos_generales
    ADD CONSTRAINT planeacion_datos_generales_pkey PRIMARY KEY (id);


--
-- Name: planeacion_organizacion planeacion_organizacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_organizacion
    ADD CONSTRAINT planeacion_organizacion_pkey PRIMARY KEY (id);


--
-- Name: planeacion_plagio planeacion_plagio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_plagio
    ADD CONSTRAINT planeacion_plagio_pkey PRIMARY KEY (id);


--
-- Name: planeacion_referencias planeacion_referencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_referencias
    ADD CONSTRAINT planeacion_referencias_pkey PRIMARY KEY (id);


--
-- Name: planeacion_relaciones_ejes planeacion_relaciones_ejes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_relaciones_ejes
    ADD CONSTRAINT planeacion_relaciones_ejes_pkey PRIMARY KEY (id);


--
-- Name: planeaciones planeaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeaciones
    ADD CONSTRAINT planeaciones_pkey PRIMARY KEY (id);


--
-- Name: sesiones_didacticas sesiones_didacticas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones_didacticas
    ADD CONSTRAINT sesiones_didacticas_pkey PRIMARY KEY (id);


--
-- Name: unidades_academicas unidades_academicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_academicas
    ADD CONSTRAINT unidades_academicas_pkey PRIMARY KEY (id);


--
-- Name: unidades_tematicas unidades_tematicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_tematicas
    ADD CONSTRAINT unidades_tematicas_pkey PRIMARY KEY (id);


--
-- Name: planeacion_datos_generales unique_planeacion_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_datos_generales
    ADD CONSTRAINT unique_planeacion_id UNIQUE (planeacion_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_planeaciones_docente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_planeaciones_docente ON public.planeaciones USING btree (docente_id);


--
-- Name: idx_planeaciones_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_planeaciones_status ON public.planeaciones USING btree (status);


--
-- Name: idx_sesiones_unidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesiones_unidad ON public.sesiones_didacticas USING btree (unidad_tematica_id);


--
-- Name: idx_unidades_planeacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_unidades_planeacion ON public.unidades_tematicas USING btree (planeacion_id);


--
-- Name: idx_usuarios_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role);


--
-- Name: idx_usuarios_unidad_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_unidad_id ON public.usuarios USING btree (unidad_id);


--
-- Name: planeacion_datos_generales trg_pdg_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pdg_updated_at BEFORE UPDATE ON public.planeacion_datos_generales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: planeacion_organizacion trg_planeacion_organizacion_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_planeacion_organizacion_updated_at BEFORE UPDATE ON public.planeacion_organizacion FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: planeaciones trg_planeaciones_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_planeaciones_updated_at BEFORE UPDATE ON public.planeaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: planeacion_plagio trg_pp_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pp_updated_at BEFORE UPDATE ON public.planeacion_plagio FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: planeacion_relaciones_ejes trg_pre_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pre_updated_at BEFORE UPDATE ON public.planeacion_relaciones_ejes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: planeacion_referencias trg_pref_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pref_updated_at BEFORE UPDATE ON public.planeacion_referencias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sesiones_didacticas trg_sd_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sd_updated_at BEFORE UPDATE ON public.sesiones_didacticas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: unidades_tematicas trg_ut_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ut_updated_at BEFORE UPDATE ON public.unidades_tematicas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: planeacion_datos_generales planeacion_datos_generales_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_datos_generales
    ADD CONSTRAINT planeacion_datos_generales_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planeacion_organizacion planeacion_organizacion_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_organizacion
    ADD CONSTRAINT planeacion_organizacion_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planeacion_plagio planeacion_plagio_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_plagio
    ADD CONSTRAINT planeacion_plagio_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planeacion_referencias planeacion_referencias_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_referencias
    ADD CONSTRAINT planeacion_referencias_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planeacion_relaciones_ejes planeacion_relaciones_ejes_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeacion_relaciones_ejes
    ADD CONSTRAINT planeacion_relaciones_ejes_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: planeaciones planeaciones_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeaciones
    ADD CONSTRAINT planeaciones_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: planeaciones planeaciones_unidad_academica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.planeaciones
    ADD CONSTRAINT planeaciones_unidad_academica_id_fkey FOREIGN KEY (unidad_academica_id) REFERENCES public.unidades_academicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sesiones_didacticas sesiones_didacticas_unidad_tematica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesiones_didacticas
    ADD CONSTRAINT sesiones_didacticas_unidad_tematica_id_fkey FOREIGN KEY (unidad_tematica_id) REFERENCES public.unidades_tematicas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unidades_tematicas unidades_tematicas_planeacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidades_tematicas
    ADD CONSTRAINT unidades_tematicas_planeacion_id_fkey FOREIGN KEY (planeacion_id) REFERENCES public.planeaciones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: usuarios usuarios_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES public.unidades_academicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

