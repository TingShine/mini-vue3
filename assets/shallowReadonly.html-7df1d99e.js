import{_ as n,o as s,c as a,e as t}from"./app-62f51890.js";const p={},e=t(`<h1 id="shallowreadoly" tabindex="-1"><a class="header-anchor" href="#shallowreadoly" aria-hidden="true">#</a> ShallowReadoly</h1><p><code>shallow</code>是浅层的意思，<code>shallowReadonly</code>跟<code>readonly</code>的区别是：<code>shallowReadonly</code>是浅层只读，其嵌套的属性如果为对象，则不用进行深层的<code>readonly</code>操作，即可以改变嵌套属性的对象里的值</p><h2 id="实现" tabindex="-1"><a class="header-anchor" href="#实现" aria-hidden="true">#</a> 实现</h2><h3 id="_1-get拦截改造" tabindex="-1"><a class="header-anchor" href="#_1-get拦截改造" aria-hidden="true">#</a> 1. get拦截改造</h3><p>实现<code>shallowReadonly</code>只需要在<code>readonly</code>的基础上改造，在判断嵌套属性是对象时不进行<code>readonly</code>就可以，我们首先来看下<code>readonly</code>的<code>get拦截</code>：</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token keyword">export</span> <span class="token keyword">enum</span> ReactiveFlags <span class="token punctuation">{</span>
  <span class="token constant">RAW</span> <span class="token operator">=</span> <span class="token string">&#39;_v_raw_&#39;</span><span class="token punctuation">,</span>
  <span class="token constant">IS_REACTIVE</span> <span class="token operator">=</span> <span class="token string">&#39;_v_isReactive&#39;</span><span class="token punctuation">,</span>
  <span class="token constant">IS_READONLY</span> <span class="token operator">=</span> <span class="token string">&#39;_v_isReadonly&#39;</span>
<span class="token punctuation">}</span>

<span class="token keyword">export</span> <span class="token keyword">const</span> <span class="token function-variable function">createGetter</span> <span class="token operator">=</span> <span class="token punctuation">(</span>isReadonly <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">,</span> shallow <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">,</span> receiver<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> <span class="token function-variable function">isExistReactiveMap</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">RAW</span> <span class="token operator">&amp;&amp;</span> reactiveMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">)</span> <span class="token operator">===</span> receiver
    <span class="token keyword">const</span> <span class="token function-variable function">isExistReadonlyMap</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">RAW</span> <span class="token operator">&amp;&amp;</span> readonlyMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">)</span> <span class="token operator">===</span> receiver
  
    <span class="token keyword">if</span> <span class="token punctuation">(</span>key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">IS_REACTIVE</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token comment">// 判断是否响应式</span>
      <span class="token keyword">return</span> <span class="token operator">!</span>isReadonly
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">IS_READONLY</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token comment">// 判断是否为只读</span>
      <span class="token keyword">return</span> isReadonly
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>
      <span class="token function">isExistReactiveMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">||</span>
      <span class="token function">isExistReadonlyMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token comment">// 获取原对象</span>
      <span class="token keyword">return</span> target
    <span class="token punctuation">}</span>
  
    <span class="token keyword">const</span> result <span class="token operator">=</span> Reflect<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">,</span> receiver<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>isReadonly<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token function">track</span><span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">,</span> <span class="token string">&#39;get&#39;</span><span class="token punctuation">)</span>
    <span class="token punctuation">}</span>
  
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">isObject</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> isReadonly <span class="token operator">?</span> <span class="token keyword">readonly</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span> <span class="token operator">:</span> <span class="token function">reactive</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> result
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>进行改造：</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token keyword">export</span> <span class="token keyword">enum</span> ReactiveFlags <span class="token punctuation">{</span>
  <span class="token constant">RAW</span> <span class="token operator">=</span> <span class="token string">&#39;_v_raw_&#39;</span><span class="token punctuation">,</span>
  <span class="token constant">IS_REACTIVE</span> <span class="token operator">=</span> <span class="token string">&#39;_v_isReactive&#39;</span><span class="token punctuation">,</span>
  <span class="token constant">IS_READONLY</span> <span class="token operator">=</span> <span class="token string">&#39;_v_isReadonly&#39;</span>
<span class="token punctuation">}</span>

<span class="token keyword">export</span> <span class="token keyword">const</span> <span class="token function-variable function">createGetter</span> <span class="token operator">=</span> <span class="token punctuation">(</span>isReadonly <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">,</span> shallow <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">,</span> receiver<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> <span class="token function-variable function">isExistReactiveMap</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">RAW</span> <span class="token operator">&amp;&amp;</span> reactiveMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">)</span> <span class="token operator">===</span> receiver
    <span class="token keyword">const</span> <span class="token function-variable function">isExistReadonlyMap</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">RAW</span> <span class="token operator">&amp;&amp;</span> readonlyMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">)</span> <span class="token operator">===</span> receiver
    <span class="token keyword">const</span> <span class="token function-variable function">isExistShallowReadonlyMap</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">RAW</span> <span class="token operator">&amp;&amp;</span> shallowReadonlyMap<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">)</span> <span class="token operator">===</span> receiver
  
    <span class="token keyword">if</span> <span class="token punctuation">(</span>key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">IS_REACTIVE</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token comment">// 判断是否响应式</span>
      <span class="token keyword">return</span> <span class="token operator">!</span>isReadonly
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>key <span class="token operator">===</span> ReactiveFlags<span class="token punctuation">.</span><span class="token constant">IS_READONLY</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token comment">// 判断是否为只读</span>
      <span class="token keyword">return</span> isReadonly
    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>
      <span class="token function">isExistReactiveMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">||</span>
      <span class="token function">isExistReadonlyMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">||</span>
      <span class="token function">isExistShallowReadonlyMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token comment">// 获取原对象</span>
      <span class="token keyword">return</span> target
    <span class="token punctuation">}</span>
  
    <span class="token keyword">const</span> result <span class="token operator">=</span> Reflect<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">,</span> receiver<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>isReadonly<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token function">track</span><span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">,</span> <span class="token string">&#39;get&#39;</span><span class="token punctuation">)</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span>shallow<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> result
    <span class="token punctuation">}</span>
  
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">isObject</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> isReadonly <span class="token operator">?</span> <span class="token keyword">readonly</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span> <span class="token operator">:</span> <span class="token function">reactive</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span>
    <span class="token punctuation">}</span>

    <span class="token keyword">return</span> result
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="highlight-lines"><br><br><br><br><br><br><br><br><br><br><div class="highlight-line"> </div><br><br><br><br><br><br><br><br><br><br><div class="highlight-line"> </div><br><br><br><br><br><br><br><br><br><br><br><div class="highlight-line"> </div><div class="highlight-line"> </div><div class="highlight-line"> </div><br><br><br><br><br><br><br><br></div><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_2-代理劫持" tabindex="-1"><a class="header-anchor" href="#_2-代理劫持" aria-hidden="true">#</a> 2. 代理劫持</h3><p><code>shallowReadonly</code>的代理劫持有之前<code>readonly</code>的示例，很容易可以实现代码：</p><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token keyword">const</span> shallowGet <span class="token operator">=</span> <span class="token function">createGetter</span><span class="token punctuation">(</span><span class="token boolean">false</span><span class="token punctuation">,</span> <span class="token boolean">true</span><span class="token punctuation">)</span>
<span class="token keyword">const</span> <span class="token function-variable function">shallowReadonlySet</span> <span class="token operator">=</span> <span class="token punctuation">(</span>target<span class="token punctuation">,</span> key<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token builtin">console</span><span class="token punctuation">.</span><span class="token function">warn</span><span class="token punctuation">(</span><span class="token template-string"><span class="token template-punctuation string">\`</span><span class="token string">Failed on key </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">\${</span>key<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">: target is readonly.</span><span class="token template-punctuation string">\`</span></span><span class="token punctuation">,</span> target<span class="token punctuation">)</span>

  <span class="token keyword">return</span> <span class="token boolean">true</span>
<span class="token punctuation">}</span>
<span class="token keyword">export</span> <span class="token keyword">const</span> shallowReadonlyHandlers <span class="token operator">=</span> <span class="token punctuation">{</span>
  get<span class="token operator">:</span> shallowGet<span class="token punctuation">,</span>
  set<span class="token operator">:</span> shallowReadonlySet
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="_3-入口函数" tabindex="-1"><a class="header-anchor" href="#_3-入口函数" aria-hidden="true">#</a> 3. 入口函数</h3><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token keyword">export</span> <span class="token keyword">const</span> shallowReadonlyMap <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">WeakMap</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">shallowReadonly</span> <span class="token punctuation">(</span>target<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token function">createReactiveObject</span><span class="token punctuation">(</span>target<span class="token punctuation">,</span> shallowReadonlyMap<span class="token punctuation">,</span> shallowReadonlyHandlers<span class="token punctuation">)</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="单元测试" tabindex="-1"><a class="header-anchor" href="#单元测试" aria-hidden="true">#</a> 单元测试</h2><div class="language-typescript line-numbers-mode" data-ext="ts"><pre class="language-typescript"><code><span class="token function">describe</span><span class="token punctuation">(</span><span class="token string">&#39;shallowReadonly&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token function">it</span> <span class="token punctuation">(</span><span class="token string">&#39;base&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> form <span class="token operator">=</span> <span class="token function">shallowReadonly</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
      count<span class="token operator">:</span> <span class="token number">1</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>
    <span class="token keyword">let</span> sum <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token keyword">let</span> calls <span class="token operator">=</span> <span class="token number">0</span>

    <span class="token function">effect</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
      sum <span class="token operator">+=</span> form<span class="token punctuation">.</span>count<span class="token punctuation">;</span>
      calls<span class="token operator">++</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>

    <span class="token function">expect</span><span class="token punctuation">(</span>sum<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>calls<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>

    form<span class="token punctuation">.</span>count <span class="token operator">+=</span> <span class="token number">1</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>sum<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>calls<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">,</span>

  <span class="token function">it</span> <span class="token punctuation">(</span><span class="token string">&#39;deep readonly&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">const</span> form <span class="token operator">=</span> <span class="token function">shallowReadonly</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
      inner<span class="token operator">:</span> <span class="token punctuation">{</span>
        count<span class="token operator">:</span> <span class="token number">1</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>
    <span class="token keyword">let</span> sum <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token keyword">let</span> calls <span class="token operator">=</span> <span class="token number">0</span>

    <span class="token function">effect</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
      sum <span class="token operator">+=</span> form<span class="token punctuation">.</span>inner<span class="token punctuation">.</span>count<span class="token punctuation">;</span>
      calls<span class="token operator">++</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span>

    <span class="token function">expect</span><span class="token punctuation">(</span>sum<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>calls<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>

    form<span class="token punctuation">.</span>inner<span class="token punctuation">.</span>count <span class="token operator">+=</span> <span class="token number">1</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>sum<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>calls<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span>
    <span class="token function">expect</span><span class="token punctuation">(</span>form<span class="token punctuation">.</span>inner<span class="token punctuation">.</span>count<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toBe</span><span class="token punctuation">(</span><span class="token number">2</span><span class="token punctuation">)</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,15),o=[e];function c(l,i){return s(),a("div",null,o)}const r=n(p,[["render",c],["__file","shallowReadonly.html.vue"]]);export{r as default};