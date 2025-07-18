import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/view/login/LoginView.vue';
import Register from "@/view/login/RegisterView.vue";
import Job_Info from "@/view/Interview/Job_Info.vue";
import Sel_CV from "@/view/Interview/Sel_CV.vue";
import Guess_Ques from "@/view/Interview/Guess_Ques.vue";
import ConfigView from "@/view/Interview/ConfigView.vue";
import Device_Test from "@/view/Interview/Device_Test.vue";
import Fin_Preparation from "@/view/Interview/Fin_Preparation.vue";
import BasedView from "@/view/Mock/BasedView.vue";
import CodingView from "@/view/Mock/CodingView.vue";

const routes = [
    {
      path: '/',
      redirect: '/login',
      component: Login
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
    path: '/register',
    name: 'Register',
    component: Register
    },
    {
        path: '/job_info',
       name:'Job_Info',
       component: Job_Info
    },
    {
        path: '/sel_cv',
       name:'Sel_CV',
       component: Sel_CV
    },
    {
        path: '/guess_ques',
       name:'Guess_Ques',
       component: Guess_Ques
    },
    {
        path: '/config_view',
       name:'Config_View',
       component: ConfigView
    },
    {
        path: '/device_test',
       name:'Device_Test',
       component: Device_Test
    },
    {
        path: '/fin_prep',
       name:'Fin_Preparation',
       component: Fin_Preparation
    },
    {
        path: '/based_view',
       name:'Based_View',
       component: BasedView
    },
    {
        path: '/coding_view',
       name:'Coding_View',
       component: CodingView
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

export default router;